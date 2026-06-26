import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
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
  | { type: 'control'; currentTimeSec: number; durationSec: number; playerState: number; command: 'pause' | 'play'; accepted: boolean }
  | { type: 'error'; code: number };

type Props = {
  videoId: string;
  onStateChange: (state: YouTubePlayerState) => void;
  onError?: (message: string) => void;
};

export type YouTubePlayerHandle = {
  readonly play: () => void;
  readonly pause: () => void;
};

export const YouTubePlayerView = forwardRef<YouTubePlayerHandle, Props>(function YouTubePlayerView({ videoId, onError, onStateChange }, ref) {
  const html = useMemo(() => buildPlayerHtml(videoId), [videoId]);
  const webViewRef = useRef<WebView>(null);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        console.log('[NoteAI player] play requested');
        webViewRef.current?.injectJavaScript(`
          (function () {
            if (window.NoteAIPlayerControls && typeof window.NoteAIPlayerControls.play === 'function') {
              window.NoteAIPlayerControls.play();
              return;
            }
            var iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
            }
          })();
          true;
        `);
      },
      pause: () => {
        console.log('[NoteAI player] pause requested');
        webViewRef.current?.injectJavaScript(`
          (function () {
            if (window.NoteAIPlayerControls && typeof window.NoteAIPlayerControls.pause === 'function') {
              window.NoteAIPlayerControls.pause();
              return;
            }
            var iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
            }
          })();
          true;
        `);
      },
    }),
    [],
  );

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as BridgeMessage;
      if (message.type === 'control') {
        console.log(`[NoteAI player] control ${message.command} accepted=${message.accepted} state=${message.playerState}`);
      }
      if (message.type === 'error') {
        onError?.(`YouTube 플레이어 오류 코드: ${message.code}`);
        return;
      }

      onStateChange({
        currentTimeSec: message.currentTimeSec,
        durationSec: message.durationSec,
        playerState: message.playerState,
        ready: message.type === 'ready' || message.type === 'time' || message.type === 'state' || message.type === 'control',
      });
    } catch {
      onError?.('플레이어 상태 메시지를 읽을 수 없습니다.');
    }
  }

  return (
    <View style={styles.frame}>
      <WebView
        ref={webViewRef}
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
});

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
              console.log('[NoteAI iframe] player state ' + event.data);
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
      window.NoteAIPlayerControls = {
        play: function () {
          var accepted = false;
          console.log('[NoteAI iframe] play requested');
          if (!player || typeof player.playVideo !== 'function') return;
          player.playVideo();
          accepted = true;
          var iframe = typeof player.getIframe === 'function' ? player.getIframe() : document.querySelector('iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
          }
          post('control', { command: 'play', accepted: accepted });
          setTimeout(function () { post('state'); }, 250);
        },
        pause: function () {
          var accepted = false;
          console.log('[NoteAI iframe] pause requested');
          if (!player || typeof player.pauseVideo !== 'function') return;
          player.pauseVideo();
          accepted = true;
          var iframe = typeof player.getIframe === 'function' ? player.getIframe() : document.querySelector('iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
          }
          post('control', { command: 'pause', accepted: accepted });
          setTimeout(function () { post('state'); }, 250);
        }
      };
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
