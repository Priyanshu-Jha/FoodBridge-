import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_BASE_URL = 'http://localhost:8080/ws';

export const connectNgoAlerts = ({ ngoId, onAlert, onConnect, onDisconnect, onError }) => {
    if (!ngoId) {
        throw new Error('ngoId is required to subscribe for NGO alerts.');
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

        client.subscribe(`/topic/ngo/${ngoId}/alerts`, (frame) => {
            try {
                const payload = JSON.parse(frame.body);
                if (onAlert) {
                    onAlert(payload);
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
