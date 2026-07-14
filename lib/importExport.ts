import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { validateProgramFile, ValidationResult } from '@/lib/validateProgram';
import { ProgramFile } from '@/types/program';

export interface PickedProgramResult {
  cancelled: boolean;
  fileName?: string;
  validation?: ValidationResult;
  parseError?: string;
}

/** Opens the system file picker and validates the selected JSON program file. */
export async function pickAndValidateProgramFile(): Promise<PickedProgramResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return { cancelled: true };
  }

  const asset = result.assets[0];

  try {
    const content = await FileSystem.readAsStringAsync(asset.uri);
    const parsed = JSON.parse(content);
    const validation = validateProgramFile(parsed);
    return { cancelled: false, fileName: asset.name, validation };
  } catch (err) {
    return {
      cancelled: false,
      fileName: asset.name,
      parseError: err instanceof Error ? err.message : 'Could not parse this file as JSON.',
    };
  }
}

/** Writes a program to a JSON file in the app's document directory and opens the share sheet. */
export async function exportProgramToFile(program: ProgramFile, suggestedName: string): Promise<void> {
  const fileName = `${suggestedName.replace(/[^a-z0-9-_]+/gi, '-')}.json`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(program, null, 2));

  if (Platform.OS === 'web') {
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export ForgeWorkout program',
    });
  }
}
