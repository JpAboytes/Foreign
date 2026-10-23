const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK 10 con package exports: @firebase/auth (build de React Native) carga
// @firebase/app en CommonJS y el resto de la app en ESM; quedan dos instancias y la app
// truena con "Component auth has not been registered yet". Solo para los módulos de
// Firebase se resuelve sin package exports, así todo Firebase usa la misma copia.
// React Native 0.88 sí necesita package exports, por eso no se desactiva global.
// Se borra este archivo al retirar Firebase (fin de la migración a Supabase).
const isFirebaseModule = (name) => name === 'firebase' || name.startsWith('firebase/') || name.startsWith('@firebase/');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (isFirebaseModule(moduleName)) {
    return context.resolveRequest({ ...context, unstable_enablePackageExports: false }, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
