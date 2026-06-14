import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { borders, colors, radii } from '../design/tokens';

export type YouTubePlayerState = {
  currentTimeSec: number;
  durationSec: number;
  playerState: number;
  ready: boolean;
};

type BridgeMessage =
  | { type: 'ready'; currentTimeSec: number; durationSec: number; playerState: number }
  | { type: 'time'; currentTimeSec: number; durationSec: number; playerState: number }
  | { type: 'state'; currentTimeSec: number; durationSec: number; playerState: number }
  | { type: 'error'; code: number };

type Props = {
  videoId: string;
  onStateChange: (state: YouTubePlayerState) => void;
  onError?: (message: string) => void;
};

export function YouTubePlayerView({ videoId, onError, onStateChange }: Props) {
  const html = useMemo(() => buildPlayerHtml(videoId), [videoId]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as BridgeMessage;
      if (message.type === 'error') {
        onError?.(`YouTube 플레이어 오류 코드: ${message.code}`);
        return;
      }

      onStateChange({
        currentTimeSec: message.currentTimeSec,
        durationSec: message.durationSec,
        playerState: message.playerState,
        ready: message.type === 'ready' || message.type === 'time' || message.type === 'state',
      });
    } catch {
      onError?.('플레이어 상태 메시지를 읽을 수 없습니다.');
    }
  }

  return (
    <View style={styles.frame}>
      <WebView
        allowsInlineMediaPlayback
        javaScriptEnabled
        mediaPlaybackRequiresUserAction
        onMessage={handleMessage}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://note-ai.local' }}
        style={styles.webView}
      />
    </View>
  );
}

function buildPlayerHtml(videoId: string): string {
  const safeVideoId = JSON.stringify(videoId);
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body, #player { margin: 0; width: 100%; height: 100%; background: #111111; overflow: hidden; }
      body { display: flex; align-items: stretch; justify-content: stretch; }
    </style>
  </head>
  <body>
    <div id="player"></div>
    <script src="https://www.youtube.com/iframe_api"></script>
    <script>
      var player;
      var lastState = -1;
      function post(type, extra) {
        if (!window.ReactNativeWebView || !player || typeof player.getCurrentTime !== 'function') return;
        var payload = Object.assign({
          type: type,
          currentTimeSec: Number(player.getCurrentTime() || 0),
          durationSec: Number(player.getDuration() || 0),
          playerState: typeof player.getPlayerState === 'function' ? player.getPlayerState() : lastState
        }, extra || {});
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          width: '100%',
          height: '100%',
          videoId: ${safeVideoId},
          playerVars: {
            playsinline: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: 'https://note-ai.local'
          },
          events: {
            onReady: function () {
              post('ready');
              setInterval(function () { post('time'); }, 500);
            },
            onStateChange: function (event) {
              lastState = event.data;
              post('state');
            },
            onError: function (event) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', code: event.data }));
              }
            }
          }
        });
      }
    </script>
  </body>
</html>`;
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.ink,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.heavy,
    overflow: 'hidden',
    width: '100%',
  },
  webView: {
    backgroundColor: colors.ink,
    flex: 1,
  },
});
