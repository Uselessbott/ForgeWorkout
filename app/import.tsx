import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useProgram } from '@/context/ProgramContext';
import { pickAndValidateProgramFile } from '@/lib/importExport';
import { sampleProgram } from '@/lib/sampleProgram';
import { todayISO } from '@/lib/dateUtils';
import { ProgramFile } from '@/types/program';

export default function ImportSheet() {
  const colors = useColors();
  const { importProgram } = useProgram();
  const [pendingFile, setPendingFile] = useState<ProgramFile | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [startDate, setStartDate] = useState(todayISO());

  const handlePickFile = async () => {
    setBusy(true);
    setErrors([]);
    try {
      const result = await pickAndValidateProgramFile();
      if (result.cancelled) return;
      if (result.parseError) {
        setErrors([result.parseError]);
        return;
      }
      if (result.validation && !result.validation.valid) {
        setErrors(result.validation.errors);
        return;
      }
      if (result.validation?.data) {
        setPendingFile(result.validation.data);
        setPendingName(result.fileName ?? result.validation.data.meta.name);
        setStartDate(result.validation.data.meta.startDate ?? todayISO());
      }
    } finally {
      setBusy(false);
    }
  };

  const handleLoadSample = () => {
    setErrors([]);
    setPendingFile(sampleProgram);
    setPendingName('sample-program.json');
    setStartDate(sampleProgram.meta.startDate ?? todayISO());
  };

  const handleConfirmImport = () => {
    if (!pendingFile) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      Alert.alert('Invalid date', 'Start date must be in yyyy-mm-dd format.');
      return;
    }
    importProgram(pendingFile, startDate);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Import a Program</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Choose a ForgeWorkout JSON file, or start with the bundled sample program.
      </Text>

      <Pressable
        style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
        onPress={handlePickFile}
        disabled={busy}
      >
        <View style={[styles.optionIcon, { backgroundColor: colors.accent }]}>
          <Feather name="upload" size={18} color={colors.accentForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionTitle, { color: colors.foreground }]}>Choose JSON file</Text>
          <Text style={[styles.optionSubtitle, { color: colors.mutedForeground }]}>
            Pick a program file from your device
          </Text>
        </View>
        {busy ? <ActivityIndicator color={colors.primary} /> : <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
      </Pressable>

      <Pressable
        style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
        onPress={handleLoadSample}
        disabled={busy}
      >
        <View style={[styles.optionIcon, { backgroundColor: colors.muted }]}>
          <Feather name="package" size={18} color={colors.mutedForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionTitle, { color: colors.foreground }]}>Load sample program</Text>
          <Text style={[styles.optionSubtitle, { color: colors.mutedForeground }]}>
            7-day starter plan to try the app
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </Pressable>

      {errors.length > 0 ? (
        <View style={[styles.errorBox, { backgroundColor: colors.destructive, borderRadius: colors.radius }]}>
          <Text style={[styles.errorTitle, { color: colors.destructiveForeground }]}>
            This file could not be imported:
          </Text>
          {errors.slice(0, 8).map((error, index) => (
            <Text key={index} style={[styles.errorLine, { color: colors.destructiveForeground }]}>
              • {error}
            </Text>
          ))}
          {errors.length > 8 ? (
            <Text style={[styles.errorLine, { color: colors.destructiveForeground }]}>
              …and {errors.length - 8} more issue(s).
            </Text>
          ) : null}
        </View>
      ) : null}

      {pendingFile ? (
        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.previewTitle, { color: colors.foreground }]}>{pendingFile.meta.name}</Text>
          <Text style={[styles.previewMeta, { color: colors.mutedForeground }]}>
            {pendingName} · {pendingFile.meta.durationDays} days
          </Text>
          {pendingFile.meta.description ? (
            <Text style={[styles.previewDescription, { color: colors.mutedForeground }]}>
              {pendingFile.meta.description}
            </Text>
          ) : null}

          <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 8 }]}>Start date (yyyy-mm-dd)</Text>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2026-07-14"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderRadius: colors.radius }]}
          />

          <Pressable
            style={[styles.confirmButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            onPress={handleConfirmImport}
          >
            <Text style={[styles.confirmButtonText, { color: colors.primaryForeground }]}>
              Set as active program
            </Text>
          </Pressable>
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            Importing sets this as your active program. Your other imported programs stay saved and can be
            switched to anytime from the Programs tab.
          </Text>
        </View>
      ) : null}

      <Pressable style={styles.cancelLink} onPress={() => router.back()}>
        <Text style={[styles.cancelLinkText, { color: colors.mutedForeground }]}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: -6,
    marginBottom: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 12.5,
    marginTop: 1,
  },
  errorBox: {
    padding: 14,
    gap: 4,
  },
  errorTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  errorLine: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  previewCard: {
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  previewTitle: {
    fontSize: 16.5,
    fontWeight: '700',
  },
  previewMeta: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  previewDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  confirmButton: {
    marginTop: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  note: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 6,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
