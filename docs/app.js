const channels = [
      {
        id: 'republic-bangla',
        name: 'Republic Bangla',
        logo: 'channel-logos/India/Bengali/republic-bangla.jpg',
        title: 'Direct 1080p Full HD Active Stream',
        sub: 'Source: Akamai Syndicate CDN (1920x1080 @ 3.9 Mbps · GPU Hardware Decoded)',
        headline: 'Headline: Fataak News · মমতা বন্দ্যোপাধ্যায়: ২৫ জুলাই সামনে আসছে ক্যাড রিপোর্ট'
      },
      {
        id: 'abp-ananda',
        name: 'ABP Ananda',
        logo: 'channel-logos/India/Bengali/abp-ananda.png',
        title: 'Official Live Share Embed Widget',
        sub: 'Source: bengali.abplive.com/sharewidget/live-tv.html (1080p HD Container)',
        headline: 'Headline: Aaj Banglay · প্রশ্নপত্রে উত্তাল রাজধানী, রণকৌশল বৈঠকে Rahul-রা'
      },
      {
        id: 'tv9-bangla',
        name: 'TV9 Bangla',
        logo: 'channel-logos/India/Bengali/tv9-bangla.png',
        title: 'CloudFront 1080p HLS Feed',
        sub: 'Source: CloudFront Syndicate CDN (1280x720 / 1080p Adaptive Feed)',
        headline: 'Headline: BREAKING · জন্ম-মৃত্যু শংসাপত্রে কারচুপি? | BJP vs TMC SCAM REPORT'
      },
      {
        id: 'news18-bangla',
        name: 'News18 Bangla',
        logo: 'channel-logos/India/Bengali/news18-bangla.jpg',
        title: 'Akamai 1080p HLS Stream',
        sub: 'Source: Akamai Broadpeak Origin Packager (Master HLS Playlist)',
        headline: 'Headline: LIVE · Fake Certificate News | SIR-র সময় প্রায় সাড়ে পনেরো লাখ বার্থ সার্টিফিকেট?'
      },
      {
        id: 'zee-24-ghanta',
        name: 'Zee 24 Ghanta',
        logo: 'channel-logos/India/Bengali/zee-24-ghanta.png',
        title: 'Official Live Embed Widget',
        sub: 'Source: zeenews.india.com/bengali/live-tv/embed (Official Zee Media Live Widget)',
        headline: 'Headline: NEET Protest · অগ্নিগর্ভ বিহার | দিল্লির সংবাদ | Zee 24 Ghanta Live'
      }
    ];

    let currentIndex = 0;

    function switchView(view) {
      const home = document.getElementById('view-home');
      const player = document.getElementById('view-player');
      const btnHome = document.getElementById('tab-btn-home');
      const btnPlayer = document.getElementById('tab-btn-player');

      if (view === 'home') {
        home.style.display = 'flex';
        player.style.display = 'none';
        btnHome.classList.add('active');
        btnPlayer.classList.remove('active');
      } else {
        home.style.display = 'none';
        player.style.display = 'block';
        btnPlayer.classList.add('active');
        btnHome.classList.remove('active');
      }
    }

    function selectChannel(id) {
      const idx = channels.findIndex(c => c.id === id);
      if (idx !== -1) {
        currentIndex = idx;
        updatePlayer();
      }
      switchView('player');
    }

    function updatePlayer() {
      const c = channels[currentIndex];
      document.getElementById('active-logo').src = c.logo;
      document.getElementById('active-name').innerText = c.name;
      document.getElementById('active-headline').innerText = c.headline;
      document.getElementById('player-title').innerText = c.title;
      document.getElementById('player-sub').innerText = c.sub;
    }

    function navigatePrev() {
      currentIndex = (currentIndex - 1 + channels.length) % channels.length;
      updatePlayer();
    }

    function navigateNext() {
      currentIndex = (currentIndex + 1) % channels.length;
      updatePlayer();
    }

    function togglePlayState() {
      const btn = document.querySelector('.btn-control.play-main');
      btn.innerText = (btn.innerText === '⏸') ? '▶' : '⏸';
    }

    /* Scroll To Top Auto-Hide Logic */
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }
    });

    function scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
