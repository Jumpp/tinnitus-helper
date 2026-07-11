import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'fi.jumpp.tinnitushelper',
  appName: 'Tinnitus Helper',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
}

export default config
