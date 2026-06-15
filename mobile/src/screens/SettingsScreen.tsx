import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { borders, colors, radii, shadows, spacing, typography } from '../design/tokens';
import type { BackendHealth } from '../domain/source';
import { getApiBaseUrl, getBackendHealth } from '../services/api';

export function SettingsScreen() {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void refreshHealth();
  }, []);

  async function refreshHealth() {
    setLoading(true);
    setError(null);
    try {
      setHealth(await getBackendHealth());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'backend 상태를 확인할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.kicker}>Settings</Text>
          <Text style={styles.title}>로컬 MVP 상태</Text>
          <Text style={styles.body}>지금 앱이 연결한 API와 provider 모드를 확인합니다.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>API 연결</Text>
          <StatusLine label="Mobile API URL" value={getApiBaseUrl()} />
          <StatusLine label="Backend" value={health ? health.status : '확인 전'} />
          <StatusLine label="Database config" value={databaseConfigLabel(health)} />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable accessibilityRole="button" onPress={refreshHealth} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>{loading ? '확인 중…' : '상태 다시 확인'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Provider 모드</Text>
          <StatusLine label="Speech-to-text" value="manual fallback" />
          <StatusLine label="Note generation" value="local structured generator" />
          <StatusLine label="Research" value="mocked_search" />
          <Text style={styles.body}>실제 OpenAI/Search/STT API 키는 연결하지 않았습니다. 유료 provider 활성화는 별도 승인 후 진행합니다.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>YouTube 정책</Text>
          <StatusLine label="Playback" value="visible embedded player only" />
          <StatusLine label="Hidden playback" value="off" />
          <StatusLine label="Download/audio extraction" value="off" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusLine}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

function databaseConfigLabel(health: BackendHealth | null): string {
  if (!health) return '확인 전';
  return health.database.configured ? '설정됨' : '미설정';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  headerCard: {
    backgroundColor: colors.blockLime,
    borderColor: colors.ink,
    borderRadius: radii.lg,
    borderWidth: borders.heavy,
    padding: spacing.xl,
    ...shadows.brutal,
  },
  kicker: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: typography.display,
    fontWeight: '900',
    lineHeight: 39,
  },
  body: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    gap: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
  },
  statusLine: {
    borderBottomColor: colors.ink,
    borderBottomWidth: borders.hairline,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  statusLabel: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  statusValue: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    lineHeight: 23,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.hotPink,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.lg,
    ...shadows.brutal,
  },
  buttonText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  buttonPressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
});
