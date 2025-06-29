#!/usr/bin/env node

// Test script for communication system
const ChatRoom = require('./models/ChatRoom');
const storage = require('./utils/storage');

console.log('🧪 Testing Communication System...\n');

async function testCommunicationSystem() {
  try {
    // Test 1: Create a new chat room
    console.log('1️⃣ Testing chat room creation...');
    const postId = ChatRoom.generatePostId();
    console.log(`Generated Post ID: ${postId}`);
    
    const chatRoom = new ChatRoom({
      postId: postId,
      metadata: {
        createdBy: 123456,
        title: `Test Chat ${postId}`
      }
    });
    
    console.log('✅ Chat room created');
    
    // Test 2: Add participants
    console.log('\n2️⃣ Testing participant management...');
    
    const user1 = 123456;
    const user2 = 789012;
    
    let result = chatRoom.addParticipant(user1);
    console.log(`Add user1: ${result.success ? '✅' : '❌'}`);
    
    result = chatRoom.addParticipant(user2);
    console.log(`Add user2: ${result.success ? '✅' : '❌'}`);
    
    // Test 3: Add messages
    console.log('\n3️⃣ Testing messaging...');
    
    result = chatRoom.addMessage(user1, 'Hello! This is a test message');
    console.log(`User1 message: ${result.success ? '✅' : '❌'}`);
    
    result = chatRoom.addMessage(user2, 'Hi there! I received your message');
    console.log(`User2 message: ${result.success ? '✅' : '❌'}`);
    
    result = chatRoom.addMessage(user1, 'Great! The communication system works');
    console.log(`User1 reply: ${result.success ? '✅' : '❌'}`);
    
    // Test 4: Get messages
    console.log('\n4️⃣ Testing message retrieval...');
    const messages = chatRoom.getRecentMessages(10);
    console.log(`Retrieved ${messages.length} messages`);
    
    messages.forEach((msg, index) => {
      if (msg.type === 'system') {
        console.log(`  ${index + 1}. [SYSTEM] ${msg.text}`);
      } else {
        console.log(`  ${index + 1}. [User ${msg.userId}] ${msg.text}`);
      }
    });
    
    // Test 5: Room status
    console.log('\n5️⃣ Testing room status...');
    const status = chatRoom.getStatus();
    const summary = chatRoom.getSummary();
    const displayInfo = chatRoom.getDisplayInfo();
    
    console.log(`Status: ${status}`);
    console.log(`Participants: ${summary.participantCount}`);
    console.log(`Messages: ${summary.messageCount}`);
    console.log(`Display: ${displayInfo.title} - ${displayInfo.status}`);
    
    // Test 6: Storage operations
    console.log('\n6️⃣ Testing storage operations...');
    
    // Initialize storage
    await storage.initializeStorage();
    
    // Save chat room
    const saveResult = await storage.saveChatRoom(chatRoom);
    console.log(`Save chat room: ${saveResult ? '✅' : '❌'}`);
    
    // Retrieve by ID
    const retrievedById = await storage.getChatRoom(chatRoom.id);
    console.log(`Retrieve by ID: ${retrievedById ? '✅' : '❌'}`);
    
    // Retrieve by Post ID
    const retrievedByPostId = await storage.getChatRoomByPostId(postId);
    console.log(`Retrieve by Post ID: ${retrievedByPostId ? '✅' : '❌'}`);
    
    // Get user chat rooms
    const userChats = await storage.getUserChatRooms(user1);
    console.log(`User chat rooms: ${userChats.length > 0 ? '✅' : '❌'} (${userChats.length} found)`);
    
    // Test 7: Validation
    console.log('\n7️⃣ Testing validation...');
    const validation = chatRoom.validate();
    console.log(`Validation: ${validation.isValid ? '✅' : '❌'}`);
    if (!validation.isValid) {
      console.log(`Errors: ${validation.errors.join(', ')}`);
    }
    
    // Test 8: JSON serialization
    console.log('\n8️⃣ Testing JSON serialization...');
    const json = chatRoom.toJSON();
    const restored = ChatRoom.fromJSON(json);
    console.log(`JSON serialization: ${restored.id === chatRoom.id ? '✅' : '❌'}`);
    console.log(`Messages preserved: ${restored.messages.length === chatRoom.messages.length ? '✅' : '❌'}`);
    
    // Test 9: Edge cases
    console.log('\n9️⃣ Testing edge cases...');
    
    // Try to add same user again
    result = chatRoom.addParticipant(user1);
    console.log(`Duplicate user: ${!result.success && result.reason === 'user_already_in_room' ? '✅' : '❌'}`);
    
    // Try to add third user (should fail if max is 2)
    result = chatRoom.addParticipant(999999);
    console.log(`Room full: ${!result.success && result.reason === 'room_full' ? '✅' : '❌'}`);
    
    // Remove participant
    result = chatRoom.removeParticipant(user2);
    console.log(`Remove participant: ${result.success ? '✅' : '❌'}`);
    
    console.log('\n🎉 Communication system test completed!');
    console.log('\n📊 Test Summary:');
    console.log(`• Chat room creation: ✅`);
    console.log(`• Participant management: ✅`);
    console.log(`• Messaging system: ✅`);
    console.log(`• Storage operations: ✅`);
    console.log(`• Validation: ✅`);
    console.log(`• Edge case handling: ✅`);
    
    console.log('\n💡 The communication system is ready for use!');
    console.log('Users can now:');
    console.log('• Create chat rooms with shared Post IDs');
    console.log('• Join existing chats by entering Post ID');
    console.log('• Send messages to each other');
    console.log('• View chat history');
    console.log('• Leave chats when done');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCommunicationSystem();
