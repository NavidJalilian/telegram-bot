const fa = require('../locales/fa');
const storage = require('../utils/storage');
const ChatRoom = require('../models/ChatRoom');
const textFilter = require('../utils/textFilter');

// Show communication menu
const showCommunicationMenu = async (ctx) => {
  try {
    await ctx.answerCbQuery?.();
    
    const menuText = `
💬 **سیستم ارتباط مستقیم**

از طریق این بخش می‌توانید با سایر کاربران ارتباط برقرار کنید.

**چگونه کار می‌کند:**
1️⃣ شناسه پست مشترک وارد کنید
2️⃣ با کاربر دیگری که همان شناسه را دارد ارتباط برقرار کنید
3️⃣ به صورت خصوصی گفتگو کنید

**گزینه‌ها:**
    `;
    
    await ctx.reply(menuText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔗 ورود به گفتگو', callback_data: 'join_chat' },
            { text: '➕ ایجاد گفتگو جدید', callback_data: 'create_chat' }
          ],
          [
            { text: '📋 گفتگوهای من', callback_data: 'my_chats' }
          ],
          [
            { text: '❓ راهنما', callback_data: 'chat_help' },
            { text: fa.back, callback_data: 'main_menu' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Show communication menu error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Start joining a chat by post ID
const startJoinChat = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    await ctx.reply('🔗 **ورود به گفتگو**\n\nلطفاً شناسه پست مشترک را وارد کنید:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.cancel, callback_data: 'communication_menu' }
          ]
        ]
      }
    });
    
    // Update session state
    await ctx.updateSession({
      state: 'entering_post_id',
      data: { action: 'join' }
    });
  } catch (error) {
    console.error('Start join chat error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Create new chat room
const createNewChat = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    // Generate new post ID
    const postId = ChatRoom.generatePostId();
    
    // Create new chat room
    const chatRoom = new ChatRoom({
      postId: postId,
      metadata: {
        createdBy: ctx.user.id,
        title: `گفتگو ${postId}`
      }
    });
    
    // Add creator as first participant
    const result = chatRoom.addParticipant(ctx.user.id);
    
    if (!result.success) {
      await ctx.reply('❌ خطا در ایجاد گفتگو. لطفاً مجدداً تلاش کنید.');
      return;
    }
    
    // Save chat room
    await storage.saveChatRoom(chatRoom);
    
    // Update user session
    await ctx.updateSession({
      state: 'in_chat',
      data: { 
        currentChatId: chatRoom.id,
        postId: postId
      }
    });
    
    const welcomeText = `
✅ **گفتگو جدید ایجاد شد!**

🆔 **شناسه پست:** \`${postId}\`

این شناسه را با کاربر مورد نظر خود به اشتراک بگذارید تا بتواند به گفتگو بپیوندد.

💡 **نکته:** کاربر دیگر باید همین شناسه را در بخش "ورود به گفتگو" وارد کند.
    `;
    
    await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📋 کپی شناسه', callback_data: `copy_post_id_${postId}` }
          ],
          [
            { text: '💬 شروع گفتگو', callback_data: 'start_chatting' },
            { text: '🚪 خروج از گفتگو', callback_data: 'leave_chat' }
          ],
          [
            { text: fa.back, callback_data: 'communication_menu' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Create new chat error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle post ID input
const handlePostIdInput = async (ctx) => {
  try {
    const postId = ctx.message.text.trim().toUpperCase();
    
    // Validate post ID format
    if (!/^[A-Z0-9]{6,10}$/.test(postId)) {
      await ctx.reply('❌ شناسه پست نامعتبر است. شناسه باید شامل 6-10 کاراکتر انگلیسی و عدد باشد.');
      return;
    }
    
    // Find chat room by post ID
    const chatRoom = await storage.getChatRoomByPostId(postId);
    
    if (!chatRoom) {
      await ctx.reply(`❌ گفتگویی با شناسه \`${postId}\` یافت نشد.\n\nآیا می‌خواهید گفتگو جدیدی با این شناسه ایجاد کنید؟`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ ایجاد گفتگو جدید', callback_data: `create_with_id_${postId}` },
              { text: '🔄 تلاش مجدد', callback_data: 'join_chat' }
            ],
            [
              { text: fa.back, callback_data: 'communication_menu' }
            ]
          ]
        }
      });
      return;
    }
    
    const room = ChatRoom.fromJSON(chatRoom);
    
    // Check if room is active
    if (!room.isActive || room.isExpired()) {
      await ctx.reply('❌ این گفتگو غیرفعال یا منقضی شده است.');
      return;
    }
    
    // Try to add user to room
    const result = room.addParticipant(ctx.user.id);
    
    if (!result.success) {
      let errorMessage = '❌ نمی‌توانید به این گفتگو بپیوندید.';
      
      switch (result.reason) {
        case 'user_already_in_room':
          errorMessage = '⚠️ شما قبلاً در این گفتگو هستید.';
          break;
        case 'room_full':
          errorMessage = '❌ این گفتگو پر است.';
          break;
        case 'room_closed':
          errorMessage = '❌ این گفتگو بسته شده است.';
          break;
      }
      
      await ctx.reply(errorMessage);
      return;
    }
    
    // Save updated room
    await storage.saveChatRoom(room);
    
    // Update user session
    await ctx.updateSession({
      state: 'in_chat',
      data: { 
        currentChatId: room.id,
        postId: postId
      }
    });
    
    // Show chat interface
    await showChatInterface(ctx, room);
    
    // Notify other participants
    await notifyParticipants(ctx, room, `کاربر جدید به گفتگو پیوست: ${ctx.user.getDisplayName()}`);
    
  } catch (error) {
    console.error('Handle post ID input error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show chat interface
const showChatInterface = async (ctx, room) => {
  try {
    const recentMessages = room.getRecentMessages(10);
    const otherParticipants = room.getOtherParticipants(ctx.user.id);
    
    let chatText = `💬 **گفتگو ${room.postId}**\n\n`;
    
    if (otherParticipants.length > 0) {
      chatText += `👥 **شرکت‌کنندگان:** ${otherParticipants.length + 1} نفر\n\n`;
    } else {
      chatText += `⏳ **در انتظار:** کاربر دیگر هنوز نپیوسته\n\n`;
    }
    
    if (recentMessages.length > 0) {
      chatText += `📝 **پیام‌های اخیر:**\n`;
      recentMessages.slice(-5).forEach(msg => {
        if (msg.type === 'system') {
          chatText += `🔔 ${msg.text}\n`;
        } else {
          const isOwn = msg.userId === ctx.user.id;
          const prefix = isOwn ? '➡️ شما' : '⬅️ کاربر';
          chatText += `${prefix}: ${msg.text}\n`;
        }
      });
    } else {
      chatText += `📝 **هنوز پیامی ارسال نشده**\n\nاولین پیام را ارسال کنید!`;
    }
    
    await ctx.reply(chatText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💬 ارسال پیام', callback_data: 'send_message' },
            { text: '🔄 بروزرسانی', callback_data: 'refresh_chat' }
          ],
          [
            { text: '📋 تاریخچه کامل', callback_data: 'show_full_history' },
            { text: '🚪 خروج از گفتگو', callback_data: 'leave_chat' }
          ],
          [
            { text: fa.back, callback_data: 'communication_menu' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Show chat interface error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Start sending message
const startSendMessage = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    await ctx.reply('💬 **ارسال پیام**\n\nپیام خود را تایپ کنید:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.cancel, callback_data: 'back_to_chat' }
          ]
        ]
      }
    });
    
    // Update session state
    await ctx.updateSession({
      state: 'sending_message',
      data: { ...ctx.session.data }
    });
  } catch (error) {
    console.error('Start send message error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle message input
const handleMessageInput = async (ctx) => {
  try {
    const messageText = ctx.message.text.trim();
    
    // Validate message
    if (messageText.length === 0) {
      await ctx.reply('❌ پیام نمی‌تواند خالی باشد.');
      return;
    }
    
    if (messageText.length > 1000) {
      await ctx.reply('❌ پیام نمی‌تواند بیش از 1000 کاراکتر باشد.');
      return;
    }
    
    // Check for sensitive content (but allow English words)
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(messageText);
    const hasCardNumber = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(messageText);
    const hasPassword = /(?:رمز|پسورد|password|pass)[\s:=]+[^\s]+/gi.test(messageText);
    
    if (hasEmail || hasCardNumber || hasPassword) {
      await ctx.reply('🚫 نمی‌توانید اطلاعات حساس (ایمیل، رمز عبور، شماره کارت) در گفتگو ارسال کنید.');
      return;
    }
    
    const chatId = ctx.session?.data?.currentChatId;
    if (!chatId) {
      await ctx.reply('❌ گفتگو یافت نشد.');
      return;
    }
    
    // Get chat room
    const chatRoomData = await storage.getChatRoom(chatId);
    if (!chatRoomData) {
      await ctx.reply('❌ گفتگو یافت نشد.');
      return;
    }
    
    const room = ChatRoom.fromJSON(chatRoomData);
    
    // Add message to room
    const result = room.addMessage(ctx.user.id, messageText);
    
    if (!result.success) {
      await ctx.reply('❌ خطا در ارسال پیام.');
      return;
    }
    
    // Save updated room
    await storage.saveChatRoom(room);
    
    // Reset session state
    await ctx.updateSession({
      state: 'in_chat',
      data: { ...ctx.session.data }
    });
    
    await ctx.reply('✅ پیام ارسال شد!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 بازگشت به گفتگو', callback_data: 'back_to_chat' }
          ]
        ]
      }
    });
    
    // Notify other participants
    await notifyParticipants(ctx, room, `پیام جدید از ${ctx.user.getDisplayName()}: ${messageText}`);
    
  } catch (error) {
    console.error('Handle message input error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Notify other participants
const notifyParticipants = async (ctx, room, message) => {
  try {
    const otherParticipants = room.getOtherParticipants(ctx.user.id);
    
    for (const participantId of otherParticipants) {
      try {
        await ctx.telegram.sendMessage(participantId, `🔔 ${message}`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💬 مشاهده گفتگو', callback_data: 'back_to_chat' }
              ]
            ]
          }
        });
      } catch (error) {
        console.error(`Failed to notify participant ${participantId}:`, error);
      }
    }
  } catch (error) {
    console.error('Notify participants error:', error);
  }
};

// Show user's chat rooms
const showMyChats = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const userChats = await storage.getUserChatRooms(ctx.user.id);
    
    if (userChats.length === 0) {
      await ctx.reply('📭 شما در هیچ گفتگویی شرکت ندارید.', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '➕ ایجاد گفتگو جدید', callback_data: 'create_chat' }
            ],
            [
              { text: fa.back, callback_data: 'communication_menu' }
            ]
          ]
        }
      });
      return;
    }
    
    const keyboard = [];
    
    for (const chatData of userChats) {
      const room = ChatRoom.fromJSON(chatData);
      const info = room.getDisplayInfo();
      
      const buttonText = `${info.status} ${info.postId} (${info.messages} پیام)`;
      keyboard.push([{
        text: buttonText,
        callback_data: `open_chat_${room.id}`
      }]);
    }
    
    keyboard.push([{ text: fa.back, callback_data: 'communication_menu' }]);
    
    await ctx.reply('📋 **گفتگوهای شما:**', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    console.error('Show my chats error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

module.exports = {
  showCommunicationMenu,
  startJoinChat,
  createNewChat,
  handlePostIdInput,
  showChatInterface,
  startSendMessage,
  handleMessageInput,
  showMyChats
};
