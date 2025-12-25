export interface ITelegramUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  language_code: string;
}

export interface IWebApp {
  initData: string;
  initDataUnsafe: {
    query_id: string;
    user: ITelegramUser;
    auth_date: string;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    onClick: (cb: VoidFunction) => void;
    offClick: (cb: VoidFunction) => void;
    show: VoidFunction;
    hide: VoidFunction;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (cb: VoidFunction) => void;
    offClick: (cb: VoidFunction) => void;
    show: VoidFunction;
    hide: VoidFunction;
    enable: VoidFunction;
    disable: VoidFunction;
    showProgress: (leave: boolean) => void;
    hideProgress: VoidFunction;
    setParams: (params: any) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: VoidFunction;
  };
  close: VoidFunction;
  expand: VoidFunction;
  ready: VoidFunction;
}

const mockWebApp: IWebApp = {
  initData: '',
  initDataUnsafe: {
    query_id: 'mock_query_id',
    user: {
      id: 123456789,
      first_name: 'Abdulloh',
      last_name: 'Dev',
      username: 'abdulloh_dev',
      language_code: 'en',
    },
    auth_date: '1700000000',
    hash: 'mock_hash',
  },
  version: '6.0',
  platform: 'unknown',
  colorScheme: 'dark',
  themeParams: {
    bg_color: '#121212',
    text_color: '#ffffff',
    hint_color: '#aaaaaa',
    link_color: '#3390ec',
    button_color: '#3390ec',
    button_text_color: '#ffffff',
    secondary_bg_color: '#1E1E1E',
  },
  isExpanded: true,
  viewportHeight: 600,
  viewportStableHeight: 600,
  isClosingConfirmationEnabled: false,
  headerColor: '#121212',
  backgroundColor: '#121212',
  BackButton: {
    isVisible: false,
    onClick: () => {},
    offClick: () => {},
    show: () => {},
    hide: () => {},
  },
  MainButton: {
    text: 'CONTINUE',
    color: '#3390ec',
    textColor: '#ffffff',
    isVisible: false,
    isActive: true,
    isProgressVisible: false,
    setText: () => {},
    onClick: () => {},
    offClick: () => {},
    show: () => {},
    hide: () => {},
    enable: () => {},
    disable: () => {},
    showProgress: () => {},
    hideProgress: () => {},
    setParams: () => {},
  },
  HapticFeedback: {
    impactOccurred: () => console.log('[Mock] Haptic Impact'),
    notificationOccurred: () => console.log('[Mock] Haptic Notification'),
    selectionChanged: () => console.log('[Mock] Haptic Selection'),
  },
  close: () => console.log('[Mock] Close WebApp'),
  expand: () => console.log('[Mock] Expand WebApp'),
  ready: () => console.log('[Mock] WebApp Ready'),
};

export const getTelegramWebApp = (): IWebApp | null => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp;
  }
  // Return mock if strictly in dev mode and not in TG, otherwise null or mock depending on preference
  // For development in browser, we return mock
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    return mockWebApp;
  }
  return null;
};
