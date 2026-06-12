const rawNews = [
    { id: 1, topic: "f1", title: "Хэмилтон: 'Нам нужны перемены в регламенте'", desc: "Льюис призывает к более справедливым правилам.", bias: 0.2 },
    { id: 2, topic: "f1", title: "Ферстаппен доминирует: 'Скучно смотреть Ф1?'", desc: "Макс выиграл 5 гонок подряд, фанаты разделились.", bias: 0.3 },
    { id: 3, topic: "f1", title: "Новая авария: FIA ужесточает меры безопасности", desc: "Совет по безопасности выпустил радикальный протокол.", bias: 0.5 },
    { id: 4, topic: "f1", title: "ЗАГОВОР против Red Bull? Саймон прокомментировал", desc: "Технический директор намекнул на неравенство.", bias: 0.7 },
    { id: 5, topic: "f1", title: "Ф1 умирает? Почему молодёжь не смотрит гонки", desc: "Алармистский взгляд на будущее королевских гонок.", bias: 0.9 },
    { id: 6, topic: "eurovision", title: "Loreen: 'Победа – это политика, а не песни'", desc: "Интервью о кулуарных играх.", bias: 0.3 },
    { id: 7, topic: "eurovision", title: "Политизация конкурса: голосование за Украину", desc: "Многие жалуются на протестные голоса.", bias: 0.5 },
    { id: 8, topic: "eurovision", title: "Секс-скандал на Евровидении, артисты в шоке", desc: "Таблоидная сенсация разрывает фан-базу.", bias: 0.7 },
    { id: 9, topic: "eurovision", title: "Евровидение больше не про музыку? Глубокая деградация", desc: "Радикальная критика жюри и формата.", bias: 0.9 },
    { id: 10, topic: "eurovision", title: "Бойкот 2025: 7 стран отказываются участвовать", desc: "Эскалация скандала вокруг организаторов.", bias: 0.8 },
    { id: 11, topic: "esports", title: "NAVI победили: русские снова лучшие в CS", desc: "Триумф на мейджоре.", bias: 0.2 },
    { id: 12, topic: "esports", title: "Киберспортсмены на допинге? Сенсация", desc: "Аддералл и стимуляторы в тир-1 командах.", bias: 0.5 },
    { id: 13, topic: "esports", title: "Valve уничтожает сцену Dota 2: патч 7.38", desc: "Разработчики не слушают комьюнити.", bias: 0.6 },
    { id: 14, topic: "esports", title: "Матчфиксинг в СНГ: сотни договорных игр", desc: "Коррупция внутри индустрии.", bias: 0.8 },
    { id: 15, topic: "esports", title: "Киберспорт мертв? Организаторы уходят", desc: "Прогноз краха всей экосистемы.", bias: 0.95 }
];

let userState = {
    likedNewsIds: new Set(),
    topicWeights: { f1: 1.0, eurovision: 1.0, esports: 1.0 },
    radicalFactor: 0.0
};

let newsHistory = [];
let compareModeActive = false;
let secondUser = null;

let newsContainer, likeCountSpan, radicalLevelSpan, dominantTopicSpan;
let homogeneitySpan, extremismSpan, homogeneityFill, extremismFill;
let compareInfoDiv, comparisonStatsDiv;

function initDomElements() {
    newsContainer = document.getElementById('newsList');
    likeCountSpan = document.getElementById('likeCount');
    radicalLevelSpan = document.getElementById('radicalLevel');
    dominantTopicSpan = document.getElementById('dominantTopic');
    homogeneitySpan = document.getElementById('homogeneity');
    extremismSpan = document.getElementById('extremism');
    homogeneityFill = document.getElementById('homogeneityFill');
    extremismFill = document.getElementById('extremismFill');
    compareInfoDiv = document.getElementById('compareInfo');
    comparisonStatsDiv = document.getElementById('comparisonStats');
}

function capWeights() {
    for (let t in userState.topicWeights) {
        if (userState.topicWeights[t] > 3.0) userState.topicWeights[t] = 3.0;
        if (userState.topicWeights[t] < 0.3) userState.topicWeights[t] = 0.3;
    }
}

function updateMetrics() {
    if (!likeCountSpan) return;
    const totalLikes = userState.likedNewsIds.size;
    likeCountSpan.innerText = totalLikes;
    radicalLevelSpan.innerText = Math.floor(userState.radicalFactor * 100);

    let maxTopic = Object.keys(userState.topicWeights).reduce((a,b) => userState.topicWeights[a] > userState.topicWeights[b] ? a : b);
    const topicNames = { f1:"Формула-1", eurovision:"Евровидение", esports:"Киберспорт" };
    dominantTopicSpan.innerText = topicNames[maxTopic] || maxTopic;

    if (newsHistory.length > 0) {
        let recentNews = newsHistory.slice(-10);
        let topicsInRecent = recentNews.map(id => rawNews.find(n => n.id === id)?.topic).filter(t => t);
        if (topicsInRecent.length) {
            let freq = {};
            topicsInRecent.forEach(t => freq[t] = (freq[t]||0)+1);
            let maxFreq = Math.max(...Object.values(freq));
            let homogeneity = (maxFreq / topicsInRecent.length) * 100;
            homogeneitySpan.innerText = Math.floor(homogeneity);
            homogeneityFill.style.width = homogeneity + "%";
        } else { homogeneitySpan.innerText="0"; homogeneityFill.style.width="0%"; }
    } else { homogeneitySpan.innerText="0"; homogeneityFill.style.width="0%"; }

    if (newsHistory.length) {
        let lastNewsItems = newsHistory.slice(-8).map(id => rawNews.find(n=>n.id===id)).filter(n=>n);
        let avgBias = lastNewsItems.reduce((acc,n)=> acc + n.bias,0)/(lastNewsItems.length||1);
        let extrem = Math.min(100, (avgBias * 100) * (0.5 + userState.radicalFactor));
        extremismSpan.innerText = Math.floor(extrem);
        extremismFill.style.width = extrem + "%";
    } else { extremismSpan.innerText = "0"; extremismFill.style.width="0%"; }
}

function generateFeed() {
    if (!newsContainer) return;
    let candidates = [...rawNews];
    let scored = candidates.map(news => {
        let topicWeight = userState.topicWeights[news.topic] || 1.0;
        let biasBonus = (news.bias * userState.radicalFactor * 1.5);
        let likeSimilarity = 0;
        for (let likedId of userState.likedNewsIds) {
            let likedNews = rawNews.find(n => n.id === likedId);
            if (likedNews && likedNews.topic === news.topic) likeSimilarity += 0.35;
        }
        let score = topicWeight * (1 + biasBonus) + likeSimilarity;
        return { news, score };
    });
    scored.sort((a,b) => b.score - a.score);
    let topNews = scored.slice(0, 12).map(item => item.news);
    for(let i=3; i<topNews.length; i++) {
        if(Math.random()<0.3) {
            let j = Math.floor(Math.random() * (topNews.length-3)) + 3;
            [topNews[i], topNews[j]] = [topNews[j], topNews[i]];
        }
    }
    renderFeed(topNews);
    newsHistory = topNews.map(n => n.id);
    updateMetrics();
}

function renderFeed(newsArray) {
    if (!newsContainer) return;
    newsContainer.innerHTML = '';
    for (let news of newsArray) {
        const card = document.createElement('div');
        card.className = 'news-card';
        let borderColor = '#3b82f6';
        if (news.topic === 'f1') borderColor = '#e10600';
        else if (news.topic === 'eurovision') borderColor = '#d4af37';
        else if (news.topic === 'esports') borderColor = '#00adb5';
        card.style.borderLeftColor = borderColor;
        
        const isLiked = userState.likedNewsIds.has(news.id);
        const topicLabel = { f1:'Формула-1', eurovision:'Евровидение', esports:'Киберспорт' }[news.topic];
        
        card.innerHTML = `
            <div class="news-topic">${topicLabel}</div>
            <div class="news-title">${news.title}</div>
            <div class="news-desc">${news.desc}</div>
            <div class="like-bar">
                <span class="bias-tag">радикализм: ${Math.floor(news.bias*100)}%</span>
                <button data-id="${news.id}" class="like-btn ${isLiked ? 'liked' : ''}">${isLiked ? 'Лайкнут' : 'Лайк'}</button>
            </div>
        `;
        const btn = card.querySelector('.like-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(news.id);
        });
        newsContainer.appendChild(card);
    }
}

function toggleLike(newsId) {
    if (userState.likedNewsIds.has(newsId)) {
        userState.likedNewsIds.delete(newsId);
    } else {
        userState.likedNewsIds.add(newsId);
        const likedNews = rawNews.find(n => n.id === newsId);
        if (likedNews) {
            let inc = 0.2 + likedNews.bias * 0.4;
            userState.topicWeights[likedNews.topic] = (userState.topicWeights[likedNews.topic] || 1) + inc;
            capWeights();
            userState.radicalFactor = Math.min(1.0, userState.radicalFactor + likedNews.bias * 0.12);
            updateMetrics();
        }
    }
    updateLikeCounter();
    generateFeed();
    if (compareModeActive && secondUser) refreshComparison();
}

function updateLikeCounter() {
    if (likeCountSpan) likeCountSpan.innerText = userState.likedNewsIds.size;
}

function initInterests() {
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const topic = chip.dataset.topic;
            chip.classList.toggle('active');
            const activeTopics = Array.from(document.querySelectorAll('.chip.active')).map(c => c.dataset.topic);
            userState.topicWeights = { f1:0.5, eurovision:0.5, esports:0.5 };
            if (activeTopics.length === 0) {
                userState.topicWeights = { f1:1, eurovision:1, esports:1 };
            } else {
                activeTopics.forEach(t => { userState.topicWeights[t] = 1.5; });
                for(let t in userState.topicWeights) if(userState.topicWeights[t]===0.5) userState.topicWeights[t]=0.7;
            }
            capWeights();
            generateFeed();
            updateMetrics();
            if (compareModeActive && secondUser) refreshComparison();
        });
    });
    chips.forEach(c => c.classList.add('active'));
    userState.topicWeights = { f1:1.5, eurovision:1.5, esports:1.5 };
    generateFeed();
}

function burstBubbleHard() {
    for (let t in userState.topicWeights) {
        userState.topicWeights[t] = 1.0;
    }
    userState.radicalFactor = 0;
    userState.likedNewsIds.clear();
    updateMetrics();
    generateFeed();
    if (compareModeActive && secondUser) {
        secondUser.topicWeights = { f1:1.0, eurovision:1.0, esports:1.0 };
        secondUser.radicalFactor = 0;
        secondUser.likedNewsIds.clear();
        refreshComparison();
    }
    updateLikeCounter();
}

function applyRandomEvent() {
    const events = [
        { msg: "Скандал в ФИА: все темы F1 становятся радикальнее +15%", effect: () => { adjustTopicRadical("f1", 0.15); } },
        { msg: "Шведская королевская семья раскритиковала EBU, Евровидение в центре скандала", effect: () => { adjustTopicRadical("eurovision", 0.2); } },
        { msg: "Игровой бум: киберспорт в mainstream! Вес темы увеличивается", effect: () => { userState.topicWeights.esports *= 1.25; capWeights(); } },
        { msg: "Всемирный договор о единстве – лента временно диверсифицирована! Пузырь ослаблен", effect: () => { burstBubbleLight(); } },
        { msg: "Утечка данных алгоритмов: радикализация резко падает", effect: () => { userState.radicalFactor = Math.max(0, userState.radicalFactor - 0.3); updateMetrics(); } },
        { msg: "Фанаты устроили бойкот: экстремальные новости доминируют!", effect: () => { userState.radicalFactor = Math.min(1, userState.radicalFactor + 0.25); updateMetrics(); } }
    ];
    const ev = events[Math.floor(Math.random() * events.length)];
    ev.effect();
    const msgDiv = document.getElementById('lastEventMsg');
    if (msgDiv) msgDiv.innerHTML = ev.msg;
    generateFeed();
    updateMetrics();
    if (compareModeActive && secondUser) refreshComparison();
}

function adjustTopicRadical(topic, add) {
    if (!userState.topicWeights[topic]) return;
    userState.topicWeights[topic] *= (1 + add);
    capWeights();
}

function burstBubbleLight() {
    for (let t in userState.topicWeights) {
        userState.topicWeights[t] = Math.max(0.8, userState.topicWeights[t] * 0.7);
    }
    userState.radicalFactor *= 0.5;
    updateMetrics();
}

function initCompareMode() {
    if(!secondUser) {
        secondUser = {
            likedNewsIds: new Set(),
            topicWeights: {...userState.topicWeights},
            radicalFactor: userState.radicalFactor
        };
        compareModeActive = true;
        refreshComparison();
    } else {
        compareModeActive = true;
        refreshComparison();
    }
}

function refreshComparison() {
    if(!secondUser || !comparisonStatsDiv) return;
    comparisonStatsDiv.style.display = "block";
    let mainDom = Object.keys(userState.topicWeights).reduce((a,b)=> userState.topicWeights[a]>userState.topicWeights[b]?a:b);
    let secDom = Object.keys(secondUser.topicWeights).reduce((a,b)=> secondUser.topicWeights[a]>secondUser.topicWeights[b]?a:b);
    const topicNamesShort = { f1:"Ф1", eurovision:"Евровидение", esports:"Киберспорт" };
    comparisonStatsDiv.innerHTML = `
        <div style="background:#111c2e; border-radius: 16px; padding:10px">
            <div><strong>ВЫ:</strong> доминанта: ${topicNamesShort[mainDom] || mainDom} | радикальность: ${Math.floor(userState.radicalFactor*100)}% | лайков:${userState.likedNewsIds.size}</div>
            <div><strong>Клон (исходный интерес):</strong> доминанта: ${topicNamesShort[secDom] || secDom} | радикальность: ${Math.floor(secondUser.radicalFactor*100)}% | лайков:${secondUser.likedNewsIds.size}</div>
            <div style="font-size:0.7rem">Клон не меняется от ваших лайков — показывает "замороженный пузырь". Чтобы обновить клон, нажмите кнопку ниже.</div>
            <button id="syncCloneBtn" style="margin-top:8px">Обновить клон с моими интересами</button>
        </div>
    `;
    const syncBtn = document.getElementById('syncCloneBtn');
    if(syncBtn) {
        syncBtn.addEventListener('click', () => {
            secondUser.topicWeights = {...userState.topicWeights};
            secondUser.radicalFactor = userState.radicalFactor;
            secondUser.likedNewsIds = new Set(userState.likedNewsIds);
            refreshComparison();
        });
    }
}

function fullReset() {
    userState.likedNewsIds.clear();
    userState.topicWeights = { f1:1.5, eurovision:1.5, esports:1.5 };
    userState.radicalFactor = 0;
    const chips = document.querySelectorAll('.chip');
    chips.forEach(c => c.classList.add('active'));
    generateFeed();
    updateMetrics();
    updateLikeCounter();
    if(compareModeActive) {
        compareModeActive = false;
        secondUser = null;
        if (comparisonStatsDiv) comparisonStatsDiv.style.display = "none";
        if (compareInfoDiv) compareInfoDiv.innerHTML = "Нажмите 'Сравнить с соседом', чтобы создать второго пользователя с теми же интересами.";
    }
    const msgDiv = document.getElementById('lastEventMsg');
    if (msgDiv) msgDiv.innerHTML = "";
}

function bindButtons() {
    const burstBtn = document.getElementById('burstBubbleBtn');
    const randomBtn = document.getElementById('randomEventBtn');
    const resetBtn = document.getElementById('resetBtn');
    const compareBtn = document.getElementById('compareModeBtn');
    const genEventBtn = document.getElementById('genEventBtn');
    
    if (burstBtn) burstBtn.onclick = () => { burstBubbleHard(); generateFeed(); };
    if (randomBtn) randomBtn.onclick = () => { applyRandomEvent(); };
    if (resetBtn) resetBtn.onclick = () => { fullReset(); };
    if (compareBtn) compareBtn.onclick = () => { initCompareMode(); };
    if (genEventBtn) genEventBtn.onclick = () => { applyRandomEvent(); };
}

document.addEventListener('DOMContentLoaded', () => {
    initDomElements();
    bindButtons();
    initInterests();
});