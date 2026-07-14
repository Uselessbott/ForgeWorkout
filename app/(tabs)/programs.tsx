import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useThemeMode, ThemeMode } from '@/context/ThemeContext';
import { useProgram } from '@/context/ProgramContext';
import * as db from '@/lib/db';
import { exportProgramToFile } from '@/lib/importExport';
import { EmptyState, SectionHeader, SegmentedControl, StatusBadge } from '@/components/ui';

export default function ProgramsScreen() {
  const colors = useColors();
  const { programs, activeProgram, setActiveProgram, deleteProgram } = useProgram();
  const { mode, setMode } = useThemeMode();
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (program: db.Program) => {
    setExportingId(program.id);
    try {
      const file = db.exportProgram(program.id);
      await exportProgramToFile(file, program.name);
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = (program: db.Program) => {
    Alert.alert('Delete program?', `"${program.name}" and all of its logged progress will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProgram(program.id) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <SectionHeader
        title="Programs"
        subtitle={`${programs.length} imported`}
        right={
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            onPress={() => router.push('/import')}
          >
            <Feather name="plus" size={16} color={colors.primaryForeground} />
          </Pressable>
        }
      />

      {programs.length === 0 ? (
        <EmptyState icon="package" title="No programs yet" description="Import your first workout & diet program." />
      ) : (
        <View style={{ gap: 12 }}>
          {programs.map((program) => (
            <View
              key={program.id}
              style={[
                styles.programCard,
                { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
              ]}
            >
              <View style={styles.programHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.programName, { color: colors.foreground }]}>{program.name}</Text>
                  <Text style={[styles.programMeta, { color: colors.mutedForeground }]}>
                    {program.durationDays} days · started {program.startDate}
                  </Text>
                </View>
                {program.isActive ? <StatusBadge label="Active" tone="success" /> : null}
              </View>

              {program.description ? (
                <Text style={[styles.programDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {program.description}
                </Text>
              ) : null}

              <View style={styles.programActions}>
                {!program.isActive ? (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.muted, borderRadius: colors.radius }]}
                    onPress={() => setActiveProgram(program.id)}
                  >
                    <Feather name="play" size={13} color={colors.foreground} />
                    <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Set active</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.muted, borderRadius: colors.radius }]}
                  onPress={() => handleExport(program)}
                  disabled={exportingId === program.id}
                >
                  <Feather name="download" size={13} color={colors.foreground} />
                  <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Export</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.destructive, borderRadius: colors.radius }]}
                  onPress={() => handleDelete(program)}
                >
                  <Feather name="trash-2" size={13} color={colors.destructiveForeground} />
                  <Text style={[styles.actionButtonText, { color: colors.destructiveForeground }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.settingsSection}>
        <SectionHeader title="Appearance" subtitle="Choose how ForgeWorkout looks" />
        <SegmentedControl<ThemeMode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          ForgeWorkout stores everything locally on this device. No accounts, no cloud sync, no ads.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 22,
    flexGrow: 1,
  },
  addButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programCard: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  programName: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  programMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  programDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  programActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  settingsSection: {
    gap: 4,
  },
  footer: {
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
