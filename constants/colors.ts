export const colors = {
  felt900: '#0B3323',
  felt800: '#0F4530',
  felt700: '#145C40',
  felt600: '#1A7A54',
  felt500: '#229966',
  felt400: '#3DB87A',
  felt300: '#7DD4A8',
  gold600: '#BA7517',
  gold500: '#EF9F27',
  gold400: '#FAC775',
  ivory300: '#F5F3EB',
  ivory400: '#E4E2D8',
  ivory500: '#C8C6B8',
  ivory900: '#2C2A24',
  suitRed: '#C0392B',
  suitBlack: '#1A1A1A',
  scorePosBg: '#145C40',
  scorePosText: '#7DD4A8',
  scoreNegBg: '#791F1F',
  scoreNegText: '#F7C1C1',
} as const;

export type Colors = typeof colors;
