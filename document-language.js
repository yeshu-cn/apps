// Shared language switch for bilingual legal documents.
const page = document.querySelector('[data-language-page]');
if (page) {
    const chinese = document.getElementById('chinese');
    const english = document.getElementById('english');
    const button = document.querySelector('.language-switch');

    function setLanguage(language) {
        const isEnglish = language === 'en';
        chinese.hidden = isEnglish;
        english.hidden = !isEnglish;
        document.documentElement.lang = isEnglish ? 'en' : 'zh-CN';
        document.title = isEnglish ? page.dataset.titleEn : page.dataset.titleZh;
        document.querySelector('.site-header nav').setAttribute('aria-label', isEnglish ? 'Main navigation' : '主导航');
        document.querySelector('.wordmark').setAttribute('aria-label', isEnglish ? 'Yeshu home' : 'Yeshu 首页');
        document.querySelectorAll('[data-text-zh][data-text-en]').forEach((element) => {
            element.textContent = isEnglish ? element.dataset.textEn : element.dataset.textZh;
        });
        const anchoredSection = location.hash.replace(/-en$/, '');
        if (anchoredSection === '#privacy' || anchoredSection === '#terms') {
            history.replaceState({}, '', location.pathname + location.search + anchoredSection + (isEnglish ? '-en' : ''));
        }
        button.textContent = isEnglish ? '简体中文' : 'English';
        button.lang = isEnglish ? 'zh-CN' : 'en';
        button.setAttribute('aria-label', isEnglish ? 'Switch to Simplified Chinese' : '切换到英文');
    }

    function readLanguage() {
        setLanguage(new URL(location.href).searchParams.get('lang'));
    }

    button.addEventListener('click', () => {
        const url = new URL(location.href);
        const language = chinese.hidden ? 'zh' : 'en';
        url.searchParams.set('lang', language);
        history.replaceState({}, '', url);
        setLanguage(language);
    });
    window.addEventListener('popstate', readLanguage);
    readLanguage();
}
