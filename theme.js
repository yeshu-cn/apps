document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const themeButtons = document.querySelectorAll('.theme-btn');

    const themes = {
        green: {
            primary: '#4B5945',
            light: '#91AC8F',
            dark: '#66785F',
            text: '#B2C9AD',
            cardBg: 'rgba(145, 172, 143, 0.1)'
        },
        warm: {
            primary: '#DEAA79',
            light: '#FFE6A9',
            dark: '#B1C29E',
            text: '#659287',
            cardBg: 'rgba(255, 230, 169, 0.1)'
        },
        pink: {
            primary: '#E6A4B4',
            light: '#F5EEE6',
            dark: '#F3D7CA',
            text: '#FFF8E3',
            cardBg: 'rgba(245, 238, 230, 0.1)'
        }
    };

    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的 active 类
            themeButtons.forEach(b => b.classList.remove('active'));
            // 添加当前按钮的 active 类
            btn.classList.add('active');
            
            // 设置主题
            const theme = themes[btn.dataset.theme];
            root.style.setProperty('--primary-color', theme.primary);
            root.style.setProperty('--primary-light', theme.light);
            root.style.setProperty('--primary-dark', theme.dark);
            root.style.setProperty('--text-color', theme.text);
            root.style.setProperty('--card-background', theme.cardBg);
        });
    });
}); 