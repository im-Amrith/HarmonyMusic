const User = require('../models/User');
const Message = require('../models/Message');

module.exports = (io) => {
  io.on('connection', async (socket) => {
    console.log('User connected:', socket.id);

    // Join user's own room
    socket.on('joinRoom', async (userId) => {
      try {
        const user = await User.findById(userId);
        if (user) {
          socket.join(`user_${userId}`);
          socket.emit('userJoined', { userId, username: user.username });
        }
      } catch (error) {
        console.error('Error joining room:', error);
      }
    });

    // Handle private messages
    socket.on('privateMessage', async (data) => {
      try {
        const { senderId, receiverId, content, type, songId, image } = data;

        // Save message to database
        const message = new Message({
          sender: senderId,
          receiver: receiverId,
          content,
          type,
          song: songId,
          image,
          conversationId: `${Math.min(senderId, receiverId)}_${Math.max(senderId, receiverId)}`
        });

        const savedMessage = await message.save();

        // Emit to both sender and receiver
        io.to(`user_${senderId}`).emit('newMessage', savedMessage);
        io.to(`user_${receiverId}`).emit('newMessage', savedMessage);

      } catch (error) {
        console.error('Error sending private message:', error);
      }
    });

    // Handle group messages (for playlists)
    socket.on('groupMessage', async (data) => {
      try {
        const { senderId, playlistId, content, type, songId, image } = data;

        // Save message to database
        const message = new Message({
          sender: senderId,
          content,
          type,
          song: songId,
          image,
          conversationId: `playlist_${playlistId}`
        });

        const savedMessage = await message.save();

        // Emit to all users in the playlist
        io.to(`playlist_${playlistId}`).emit('newGroupMessage', savedMessage);

      } catch (error) {
        console.error('Error sending group message:', error);
      }
    });

    // Handle playlist collaboration
    socket.on('joinPlaylist', async (playlistId) => {
      try {
        socket.join(`playlist_${playlistId}`);
        socket.emit('joinedPlaylist', { playlistId });
      } catch (error) {
        console.error('Error joining playlist:', error);
      }
    });

    // Handle song updates
    socket.on('updatePlaylistSong', async (data) => {
      try {
        const { playlistId, songId, action } = data;
        io.to(`playlist_${playlistId}`).emit('playlistSongUpdated', { playlistId, songId, action });
      } catch (error) {
        console.error('Error updating playlist song:', error);
      }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
