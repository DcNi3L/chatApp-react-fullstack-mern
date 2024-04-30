import express from 'express';
import MessageController from '../controllers/MessageController.js';

const router = express.Router();

router.get('/:userId', MessageController.getUserMessages);
router.delete('/:messageId', MessageController.deleteMessage);
router.delete('/:senderId/:recipientId', MessageController.deleteConversation);

export default router;
