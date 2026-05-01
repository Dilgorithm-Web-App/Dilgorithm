import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Grab the room name from the URL (e.g., room "user1_user2")
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Accept the WebSocket connection
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket (React frontend)
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        sender = text_data_json.get('sender', 'Anonymous')

        # UC-25: Automatic Profanity Detection
        # A simple list for our MVP. You can expand this or connect it to an NLP API later.
        profanity_list = ["badword1", "badword2", "hate", "scam"] 
        
        is_clean = True
        for word in profanity_list:
            if word in message.lower():
                is_clean = False
                break

        if not is_clean:
            # Block message and warn sender
            await self.send(text_data=json.dumps({
                'error': 'Message blocked: Violates community guidelines.'
            }))
            return # Stop processing the message

        # If clean, send message to the entire room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': sender
            }
        )

    # Receive message from room group and send it down to the frontend
    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender
        }))