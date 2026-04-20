import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_BASE_URL = 'http://localhost:8080/ws';

export const connectDonorTracker = ({ donorId, onUpdate, onConnect, onDisconnect, onError }) => {
    if (!donorId) {
        throw new Error('donorId is required to subscribe for donor tracker updates.');
    }

    const client = new Client({
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        webSocketFactory: () => new SockJS(WS_BASE_URL),
    });

    client.onConnect = () => {
        if (onConnect) {
            onConnect();
        }

        client.subscribe(`/topic/donor/${donorId}/tracker`, (frame) => {
            try {
                const payload = JSON.parse(frame.body);
                if (onUpdate) {
                    onUpdate(payload);
                }
            } catch (err) {
                if (onError) {
                    onError(err);
                }
            }
        });
    };

    client.onStompError = (frame) => {
        if (onError) {
            onError(new Error(frame.headers?.message || 'STOMP error'));
        }
    };

    client.onWebSocketClose = () => {
        if (onDisconnect) {
            onDisconnect();
        }
    };

    client.activate();

    return () => {
        client.deactivate();
    };
};

