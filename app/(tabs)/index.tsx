import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useProgram } from '@/context/ProgramContext';
import * as db from '@/lib/db';
import { DayDetailView } from '@/components/DayDetailView';
import { EmptyState } from '@/components/ui';

export default function TodayScreen() {
  const colors = useColors();
  const { activeProgram, loading } = useProgram();
  const [day, setDay] = useState<db.ProgramDay | null>(null);

  const loadDay = useCallback(() => {
    if (!activeProgram) {
      setDay(null);
      return;
    }
    const dayNumber = db.getTodayDayNumber(activeProgram);
    setDay(db.getProgramDay(activeProgram.id, dayNumber));
  }, [activeProgram]);

  useFocusEffect(
    useCallback(() => {
      loadDay();
    }, [loadDay]),
  );

  if (loading) return null;

  if (!activeProgram) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="zap"
          title="No active program"
          description="Import a workout & diet program to get started."
          action={
            <Pressable
              style={[styles.importButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
              onPress={() => router.push('/import')}
            >
              <Feather name="upload" size={16} color={colors.primaryForeground} />
              <Text style={[styles.importButtonText, { color: colors.primaryForeground }]}>Import a program</Text>
            </Pressable>
          }
        />
      </View>
    );
  }

  if (!day) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState icon="check-circle" title="Program complete" description="You've reached the end of this program." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DayDetailView day={day} onRefresh={loadDay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 8,
  },
  importButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
});
