package com.example.project.foodbridge.websocket.controller;

import com.example.project.foodbridge.websocket.dto.SocketMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    @MessageMapping("/ping")
    @SendTo("/topic/system")
    public SocketMessage ping(@Payload SocketMessage inbound) {
        String text = inbound != null && inbound.getMessage() != null
                ? inbound.getMessage()
                : "ping";

        return new SocketMessage(
                "SYSTEM",
                "WebSocket server received: " + text,
                System.currentTimeMillis());
    }
}
