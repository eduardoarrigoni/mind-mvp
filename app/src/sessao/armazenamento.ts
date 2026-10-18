import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHAVE_TOKEN = 'mind.token';

/**
 * Guarda o token de sessão. No celular usa o SecureStore (Keychain no iOS,
 * Keystore no Android). O SecureStore não existe no navegador; no Expo web
 * (usado só para demonstração) o token fica no localStorage.
 */
export async function salvarToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(CHAVE_TOKEN, token);
    return;
  }
  await SecureStore.setItemAsync(CHAVE_TOKEN, token);
}

export async function lerToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(CHAVE_TOKEN) ?? null;
  }
  return SecureStore.getItemAsync(CHAVE_TOKEN);
}

export async function apagarToken(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(CHAVE_TOKEN);
    return;
  }
  await SecureStore.deleteItemAsync(CHAVE_TOKEN);
}
