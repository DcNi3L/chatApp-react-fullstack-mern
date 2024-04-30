import { Message } from '../models/Message.js';
import { getUserDataFromReq } from '../utils/helpers.js';
import fs from 'fs';
import path from 'path';


const __dirname = path.resolve();
const MessageController = {
    async getUserMessages(req, res) {
        try {
            const { userId } = req.params;
            const userData = await getUserDataFromReq(req);
            const ourUserId = userData.userId;
            const messages = await Message.find({
                sender: { $in: [userId, ourUserId] },
                recipient: { $in: [userId, ourUserId] },
            }).sort({ createdAt: 1 });
            res.json(messages);
        } catch (error) {
            res.status(500).json(error.message);
        }
    },

    async deleteMessage(req, res) {
        try {
            const { messageId } = req.params;
            const deletedMessage = await Message.findOneAndDelete({_id: messageId});
            if (deletedMessage.file !== null) {
                const filePath = path.join(__dirname, 'uploads', deletedMessage.file);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log("file was deleted from uploads: ", deletedMessage.file);
                }
            }
            res.status(200).json({ message: 'Message deleted successfully' });
        } catch (error) {
            res.status(500).json(error.message);
        }
    },
    
    async deleteConversation(req, res) {
        try {
            const { senderId, recipientId } = req.params;
            const deletedMessages = await Message.find()
            
            await Message.deleteMany({
                $or: [
                    { sender: senderId, recipient: recipientId },
                    { sender: recipientId, recipient: senderId },
                ],
            });
            
            deletedMessages.forEach((deletedMessage) => {
                if (deletedMessage.file !== null) {
                    const filePath = path.join(__dirname, 'uploads', deletedMessage.file);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log("file was deleted from uploads: ", deletedMessage.file);
                    }
                }
            });
            res.status(200).json({ message: 'Messages deleted successfully' });
        } catch (error) {
            res.status(500).json(error.message);
        }
    },
};

export default MessageController;
