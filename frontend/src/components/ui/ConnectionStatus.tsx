import React from 'react'

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

type SensorStatus = "normal" | "alert" | "alarm" | "critical"

interface SensorTile {
    centroid: [number, number]
    status: SensorStatus
}

interface Sensor {
    sensor: string
    status: SensorStatus
    centroid: [number, number]
    tiles: SensorTile[]
}

interface ConnectionStatusIndicatorProps {
    connectionState: ConnectionState
    sensorsData: Sensor[]
    lastUpdateTime: string | null
    onReconnect?: () => void
}

const getConnectionDisplay = (state: ConnectionState) => {
    switch (state) {
        case 'connected':
            return {
                emoji: '🟢',
                text: 'Live Stream',
                color: '#4caf50',
                borderColor: '#4caf50',
                subtext: 'Real-time updates every 30s'
            }
        case 'connecting':
            return {
                emoji: '🟡',
                text: 'Connecting...',
                color: '#ff9800',
                borderColor: '#ff9800',
                subtext: 'Establishing connection...'
            }
        case 'error':
            return {
                emoji: '🔴',
                text: 'Connection Error',
                color: '#f44336',
                borderColor: '#f44336',
                subtext: 'Click to reconnect'
            }
        case 'disconnected':
            return {
                emoji: '⚪',
                text: 'Disconnected',
                color: '#9e9e9e',
                borderColor: '#9e9e9e',
                subtext: 'Click to reconnect'
            }
    }
}

export const ConnectionStatus: React.FC<ConnectionStatusIndicatorProps> = ({
                                                                                        connectionState,
                                                                                        sensorsData,
                                                                                        lastUpdateTime,
                                                                                        onReconnect
                                                                                    }) => {
    const connectionDisplay = getConnectionDisplay(connectionState)
    const isClickable = connectionState === 'error' || connectionState === 'disconnected'

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '50%',
                right: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 1000,
                border: `2px solid ${connectionDisplay.borderColor}`,
                cursor: isClickable ? 'pointer' : 'default'
            }}
            onClick={isClickable ? onReconnect : undefined}
        >
            <div style={{
                color: connectionDisplay.color,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                <span>{connectionDisplay.emoji}</span>
                {connectionDisplay.text}
                {connectionState === 'connected' && ` (${sensorsData.length} sensors)`}
            </div>
            {lastUpdateTime && (
                <div style={{ color: '#666', fontSize: '10px', marginTop: '2px' }}>
                    Last update: {new Date(lastUpdateTime).toLocaleTimeString()}
                </div>
            )}
            <div style={{ color: '#666', fontSize: '10px', marginTop: '2px' }}>
                {connectionDisplay.subtext}
            </div>
        </div>
    )
}