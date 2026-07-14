import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useColors } from '@/hooks/useColors';
import { useProgram } from '@/context/ProgramContext';
import * as db from '@/lib/db';
import { DayDetailView } from '@/components/DayDetailView';
import { EmptyState } from '@/components/ui';

export default function DayScreen() {
  const colors = useColors();
  const { activeProgram } = useProgram();
  const { dayNumber } = useLocalSearchParams<{ dayNumber: string }>();
  const [day, setDay] = useState<db.ProgramDay | null>(null);

  const loadDay = useCallback(() => {
    if (!activeProgram) {
      setDay(null);
      return;
    }
    setDay(db.getProgramDay(activeProgram.id, Number(dayNumber)));
  }, [activeProgram, dayNumber]);

  useFocusEffect(
    useCallback(() => {
      loadDay();
    }, [loadDay]),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `Day ${dayNumber}` }} />
      {day ? (
        <DayDetailView day={day} onRefresh={loadDay} />
      ) : (
        <EmptyState icon="calendar" title="Day not found" description="This day is outside the active program range." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
