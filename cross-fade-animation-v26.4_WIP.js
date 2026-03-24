// OSMO PAGE TRANSITION BOILERPLATE

import initSpotlightSection from "https://cdn.jsdelivr.net/gh/AVOSSSigmaTeam/public.test/spotlight-section-animation-v6.16.js";
import initDemoSection from "https://cdn.jsdelivr.net/gh/AVOSSSigmaTeam/public.test/demo-section-animation_v2.4.js";
import {hideYouTubeOverlay, initHallOfFame} from "https://cdn.jsdelivr.net/gh/AVOSSSigmaTeam/public.test/hall-of-fame_v8.4_WIP.js";

import { restartWebflow } from 'https://cdn.jsdelivr.net/npm/@finsweet/ts-utils/+esm';

gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
CustomEase.create("articleBackgroundScale", "0.25, 0.46, 0.45, 0.94");
gsap.defaults({ ease: "osmo", duration: durationDefault });


let cmsFilterInstance = null;

const DEBUG = !true; // Set to 'false' in production

const navSubmitDemoButton = document.querySelector('[data-nav-submit-demo-button]');
const loadingContainer = document.querySelector('[data-loader-container]');

let employeAvatarAnimationInterval = null;
let player = null;

// let nodeClones = {
//   homeSpotlightSection: null,
//   homeAudioControls: null,
// };

// FUNCTION REGISTRY

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Runs once on first load
  // if (has('[data-something]')) initSomething();
  
  const page = document.querySelector("[data-page-name]");
  const pageName = page ? page.getAttribute("data-page-name") : '';
  if (DEBUG) console.log("Page Name:", pageName);
  if (pageName != 'hall-of-fame') {
    initSimpleLoaderAnimation();
    if (DEBUG) console.log("Run Loader Animation");
  }

  const nav = document.querySelector("[data-master-navigation]");
  initButtonHoverAnimation(nav);

  handleMobileNavLinkClicks();

  initNavTooltips();
  
  initNavigationChannelsMenuExpandAnimation();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // Runs before the enter animation
  // if (has('[data-something]')) initSomething();

  cleanSimpleAnimations(nextPage);
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  // Runs after enter animation completes
  // if (has('[data-something]')) initSomething();

  if (hasLenis) {
    lenis.resize();
  }

  const pageName = nextPage.getAttribute("data-page-name") || ''; 
  if (DEBUG) console.log(pageName);

  switch (pageName) {

    case 'home':
      let homeSpotlightSection = nextPage.querySelector('[data-spotlight-section]');
      let homeAudioControls = nextPage.querySelector('[data-audio-control]');
      if (isMobileOrTablet()) {
        homeSpotlightSection.style.display = "none";
        homeAudioControls.style.display = "none";
        initSimpleMarqueeScroll();
      } else {
        homeAudioControls.style.display = "flex";
        initHomeAudio();
        initMarqueeScrollDirection();
        homeSpotlightSection.style.display = "block";
        initSpotlightSection();
        initDemoSection();
      }
      break;

    case 'articles':
      initArticleItemHoverAnimation(nextPage);
      break;

    case 'hall-of-fame':
      initSimpleLoaderAnimation();  
      if (DEBUG) console.log("Run Loader Animation on Hall of Fame");
      initHallOfFame(nextPage);
      break;

  }


  const pageType = nextPage.getAttribute("data-barba-namespace") || ''; 
  if (DEBUG) console.log(pageType);

  if (pageType == 'article') {
    initArticleItemHoverAnimation(nextPage);
    replaceRichTextButtons(nextPage);
    hideDuplicateArticleFromMoreArticlesSection(nextPage);
  }


  const animatedEmployeeAvatars = document.querySelectorAll('[data-animate-employee-avatar]');
  if (animatedEmployeeAvatars.length !== 0) {
    initAnimatedEmployeeAvatars(animatedEmployeeAvatars);
  }

  initButtonHoverAnimation(nextPage);

  initSimpleElementAnimations();

}



// PAGE TRANSITIONS

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next);
  }, null, 0);

  return tl;
}

function runPageLeaveAnimation(current, next) {

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    }
  })

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.to(current, {
    autoAlpha: 0,
    ease: "power1.in",
    duration: 0.5,
  }, 0);

  return tl;
}

function runPageEnterAnimation(next){
  const tl = gsap.timeline();

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady")
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 0);

  tl.fromTo(next, {
    autoAlpha: 0,
  }, {
    autoAlpha: 1,
    ease: "power1.inOut",
    duration: 0.75,
  }, "startEnter");

  // tl.fromTo(next.querySelector('h1'), {
  //   yPercent: 25,
  //   autoAlpha: 0,
  // }, {
  //   yPercent: 0,
  //   autoAlpha: 1,
  //   ease: "expo.out",
  //   duration: 1,
  // }, "< 0.3");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}



// BARBA HOOKS + INIT

barba.hooks.beforeLeave(data => {

  let current = data.current.container;
  const currentPageName = current.getAttribute("data-page-name") || '';

  if (currentPageName == 'hall-of-fame'){
    let overlay = document.getElementById("youtube-overlay");
    if (!!overlay) {
      let overlayActive = overlay.classList.contains('active');
      if (overlayActive) {
        hideYouTubeOverlay();
      }
    }
  } else if (currentPageName == 'home') {
    const audioMuteBtn = document.getElementById("audioMuteBtn");
    audioMuteBtn.click();
    player.stop();
    player.destroy();
  }

  let next = data.next.container;
  const nextPageName = next.getAttribute("data-page-name") || '';

  if (nextPageName == 'hall-of-fame') {
    gsap.set(loadingContainer, {
      display: 'flex',
      visibility: 'visible'
    });
    gsap.to(loadingContainer, {
      opacity: 1
    });
  }

  clearInterval(employeAvatarAnimationInterval);

});

barba.hooks.beforeEnter(data => {
  // Position new container on top
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if(hasScrollTrigger){
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
  // checkNavSubmitDemoButton(data.next.container);
})

barba.hooks.afterEnter(async data => {
  // Run page functions
  initAfterEnterFunctions(data.next.container);

  //Restart Finsweet
  if (window.FinsweetAttributes) {
    try {
      await window.FinsweetAttributes.modules.list.restart();
      await window.FinsweetAttributes.modules.copyclip.restart();
      await window.FinsweetAttributes.modules.socialshare.restart();
    } 
    catch (e) {
      if (DEBUG) console.warn('Finsweet restart error:', e);
    }
  }
  if (DEBUG) console.log(window.FinsweetAttributes);

  //Make form submit button work
  initFormSubmitButtonHoverAnimation(data.next.container);

  // Settle
  if(hasLenis){
    lenis.resize();
    lenis.start();
  }

  // if(hasScrollTrigger){
  //   ScrollTrigger.refresh();
  // }

});

barba.hooks.after(() => {
  if(hasScrollTrigger){
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: DEBUG,
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      // First load
      async once(data) {

        initOnceFunctions();

        return runPageOnceAnimation(data.next.container);
      },

      // Current page leaves
      async leave(data) {

        // Restart Webflow IX2 interactions
        await restartWebflow();

        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      // New page enters
      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      },

    }
  ],
});



// GENERIC + HELPERS

const themeConfig = {
  light: {
    nav: "dark",
    transition: "light"
  },
  dark: {
    nav: "light",
    transition: "dark"
  }
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector('[data-theme-transition]');
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector('[data-theme-nav]');
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function initLenis() {
  if (lenis) return; // already created
  if (!hasLenis) return;

  // lenis = new Lenis({
  //   lerp: 0.165,
  //   wheelMultiplier: 1.25,
  // });

  lenis = new Lenis({
    // duration: isMobile ? 0.8 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    smoothTouch: false, // Disable smooth touch scrolling on all devices
    touchMultiplier: 1, // Reduced from 2 to prevent scroll issues
    autoResize: true, // Automatically handles ResizeObserver for content changes
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container){
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if(hasLenis){
    lenis.resize();
    lenis.start();
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth,
    timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement('template');
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
  var currentNodes = document.querySelectorAll('nav [data-barba-update]');

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    // Aria-current sync
    var newStatus = next.getAttribute('aria-current');
    if (newStatus !== null) {
      curr.setAttribute('aria-current', newStatus);
    } else {
      curr.removeAttribute('aria-current');
    }

    // Class list sync
    var newClassList = next.getAttribute('class') || '';
    curr.setAttribute('class', newClassList);
  });

}



// YOUR FUNCTIONS GO BELOW HERE

function initAnimatedEmployeeAvatars(avatars) {

  // const avatars = document.querySelectorAll('[data-animate-employee-avatar]');
  // if (avatars.length === 0) return;
  let i = 0;
  const animationDelay = 2500; //in ms
  employeAvatarAnimationInterval = setInterval(() => {

    avatars[i].style.opacity = "0";
    avatars[i = (i + 1) % avatars.length].style.opacity = "1";

  }, animationDelay);

}

function initFooterLinkHoverAnimation() {

  const footerLinkColumns = document.querySelectorAll('[data-footer-column]');

  if (footerLinkColumns.length === 0) return;

  const footerLinkHoverAnimationDuration = 0.2;

  footerLinkColumns.forEach(column => {
    const links = column.querySelectorAll('[data-footer-link]');

    links.forEach(link => {

      link.addEventListener('mouseenter', () => {

        links.forEach(sibling => {
          if (sibling !== link) {
            gsap.to(sibling, {
              opacity: 0.5,
              duration: footerLinkHoverAnimationDuration,
              ease: "linear"
            });
          }
        });
      });

      link.addEventListener('mouseleave', () => {
        links.forEach(sibling => {
          gsap.to(sibling, {
            opacity: 1,
            duration: footerLinkHoverAnimationDuration,
            ease: "linear"
          });
        });
      });

    });

  });

}

function initButtonHoverAnimation(page) {
  page = page || document;
  
  const allButtons = page.querySelectorAll('[data-animate-button]');

  allButtons.forEach((button) => {
    
    const buttonText = button.querySelector('[button-text]');
    const buttonBackground = button.querySelector('[button-bg]');
    const buttonIconsLeft = button.querySelectorAll('[button-icon-left]');
    const buttonIconsRight = button.querySelectorAll('[button-icon-right]');

    const split = SplitText.create(buttonText, {type: "chars"});

    const tl = gsap.timeline();

    if (!!buttonBackground) {

      tl.to(buttonBackground, {
        scale: 0.95,
        duration: 0.5,
        ease: "sine.inOut",
      }, 0)

    }

    if (buttonIconsLeft.length != 0) {

      buttonIconsLeft.forEach((icon) => {
        
        tl.to(icon, {
          xPercent: -100,
          duration: 0.64,
          ease: "sine.inOut",
        }, 0);

      });

    }

    if (buttonIconsRight.length != 0) {

      buttonIconsRight.forEach((icon) => {
        
        tl.to(icon, {
          xPercent: 100,
          duration: 0.64,
          ease: "sine.inOut",
        }, 0);

      });

    }

    tl.to(split.chars, {
      y: "-1.5em",
      duration: 0.64,
      ease: "power4.inOut",
      stagger: { amount: 0.1 }
    }, 0);

    tl.pause();

    button.addEventListener("mouseenter", () => { tl.play(); });

    button.addEventListener("mouseleave", () => { tl.reverse(); });

  });

}

function initFormSubmitButtonHoverAnimation(page) {

  const allSubmitButtonWraps = page.querySelectorAll('[data-submit-button-wrap]');

  allSubmitButtonWraps.forEach((buttonWrap) => {
    
    const submitButton = buttonWrap.querySelector('[data-submit-button]');

    if (!submitButton) return;

    const visibleButton = buttonWrap.querySelector('[data-submit-button-link]');

    if (!visibleButton) return;

    submitButton.classList.add("hide");

    visibleButton.addEventListener('click', () => {

      initDemoSectionForm();
      submitButton.click();

    })

  });

}

function initFadeInElementAnimations(page) {
  page = page || document;
  const fadeInElements = page.querySelectorAll('[data-animate-fade-in]');
  const fadeInDefaultDelay = 0.4;
  fadeInElements.forEach((element) => {
    let elementDelay = parseFloat(element.getAttribute('data-animate-fade-in') || fadeInDefaultDelay);
    gsap.to(element, {
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.5,
      delay: elementDelay,
      ease: "power1.out",
      onComplete: () => {
        //remove style properties after animation completes to prevent issues with responsive and other animations
        gsap.set(element, {
          clearProps: "opacity,filter"
        });
      },
      scrollTrigger: {
        markers: DEBUG,
        trigger: element,
        start: "top bottom",
        toggleActions: "play none none none"
      }
    });
  });
}

function initSlideInFromBottomAnimations() {
  const slideInFromBottomElements = document.querySelectorAll("[data-animate-slide-in-from-bottom]");
  if (slideInFromBottomElements.length !== 0){
    gsap.fromTo(slideInFromBottomElements, {
      opacity: 0,
      yPercent: 50,
    }, {
      opacity: 1,
      yPercent: 0,
      duration: 0.5,
      delay: 0.3,
      ease: "power1.out",
      stagger: 0.1,
      scrollTrigger: {
        trigger: slideInFromBottomElements[0], // group trigger
        start: "top bottom",
        toggleActions: "play none none none",
        markers: DEBUG
      }
    });
  }
}

function initTrustedByScroller() {
  const trustedByScrollers = document.querySelectorAll('[data-animate-trusted-by-scroller]');
  trustedByScrollers.forEach((scroller) => {
    gsap.fromTo(scroller, {
      xPercent: 0
    }, {
      xPercent: 100,
      duration: 10,
      ease: "linear",
      repeat: -1
    })
  });
}

function initRevealParagraphAnimation() {
  const revealParagraphs = document.querySelectorAll('[data-animate-paragraph-reveal]');
  revealParagraphs.forEach((paragraph) => {
    let split = new SplitText(paragraph, {
      type: "lines",
      mask: "lines",
      linesClass: "line"
    });
    split.lines.forEach((line) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("line-wrapper");
      line.parentNode.insertBefore(wrapper, line);
      wrapper.appendChild(line);
    })
    gsap.fromTo(split.lines, {
      yPercent: 105
    }, {
      yPercent: 0,
      duration: 0.5,
      stagger: 0.05,
      ease: "power1.out",
      scrollTrigger: {
        trigger: paragraph,
        start: "top 85%",
        toggleActions: "play none none none",
        markers: DEBUG
      }
    })
  })
}

function initSimpleElementAnimations() {

  initFadeInElementAnimations();

  initSlideInFromBottomAnimations();

  initTrustedByScroller();

  initRevealParagraphAnimation();  

  initFooterLinkHoverAnimation();

}

function cleanSimpleAnimations(page) {

  const fadeInElements = page.querySelectorAll('[data-animate-fade-in]');
  fadeInElements.forEach((element) => {
    gsap.set(element, {
      opacity: 0,
      filter: "blur(12px)"
    });
  });


  const slideInFromBottom = page.querySelectorAll('[data-animate-slide-in-from-bottom]');
  slideInFromBottom.forEach((element) => {
    gsap.set(element, {
      opacity: 0,
      yPercent: 50,
    })
  });

}

function handleMobileNavLinkClicks(page) {
  page = page || document;

  const menuOpenIcon = page.querySelector('[data-menu-open-icon]');
  const menuCloseIcon = page.querySelector('[data-menu-close-icon]');
  const mobileNavMenu = page.querySelector('[data-mobile-nav-menu]');
  let MobileNavMenuLinks = mobileNavMenu.querySelectorAll('a');
  let brandLink = page.querySelector('[data-nav-brand-link]');

  const allMobileNavMenuLinks = [...MobileNavMenuLinks, brandLink];

  allMobileNavMenuLinks.forEach((link) => {
    
    link.addEventListener('click', () => {
      menuCloseIcon.style.display = "none";
      menuOpenIcon.style.display = "flex";
    })

  });

}

function initNavigationChannelsMenuExpandAnimation(page) {
  page = page || document;

  const nav = page.querySelector('[data-navigation]');
  const dropdownList = page.querySelector('[data-dropdown-list]');
  const background = page.querySelector('[data-nav-background]');
  const dropLink = page.querySelector('[data-dropdown-link]');
  const dropHelper = page.querySelector('[data-animate-drop]');

  if ( !nav || !dropdownList || !background || !dropLink || !dropHelper ) return;

  const navExapandTimeline = gsap.timeline();

  navExapandTimeline
    .fromTo(nav, {
      width: "58rem"
    }, {
      width: "112.5rem",
      duration: 0.6,
      ease: "power1.inOut"
    }, 0)
    .fromTo(nav, {
      height: "2.8125rem",
    }, {
      height: "27.1875rem",
      duration: 0.6,
      ease: "power1.inOut"
    }, 0)
    .fromTo(background, {
      opacity: 0
    }, {
      opacity: 1,
      duration: 0.5,
      ease: "power1.out"
    }, 0)
    .fromTo(dropdownList, {
      opacity: 0
    }, {
      opacity: 1,
      duration: 0.45,
      ease: "power1.inOut"
    }, 0.4);

  navExapandTimeline.pause();

  dropLink.addEventListener("mouseenter", () => {
    navExapandTimeline.play();
  });

  dropHelper.addEventListener("mouseleave", () => {
    navExapandTimeline.reverse();
  });

}

function initSimpleLoaderAnimation(page) {
  // page = page || document;

  // const loadingContainer = page.querySelector('[data-loader-container]');

  const tl = gsap.timeline();
  const animationDuration = 1;

  tl.set(loadingContainer, {
    display: 'flex',
    opacity: 1,
    visibility: 'visible'
  }, 0);

  tl.to(loadingContainer, {
    autoAlpha: 0,
    duration: animationDuration,
    ease: "Power1.easeInOut",
  }, animationDuration);

  tl.set(loadingContainer, {
    display: 'none'
  }, (animationDuration * 2));
}

function initSimpleMarqueeScroll() {
  const marquees = document.querySelectorAll("[data-marquee-scroll-target]");
  marquees.forEach(marquee => {
    const colletion = marquee.querySelector("[data-marquee-collection-target]");
    marquee.append(colletion.cloneNode(true));
    marquee.append(colletion.cloneNode(true));
    const allCollections = marquee.querySelectorAll("[data-marquee-collection-target]");
    allCollections.forEach(collection => {
      gsap.to(collection, {
        xPercent: -100,
        repeat: -1,
        ease: "linear",
        duration: 10
      });
    });
  });
}

function initMarqueeScrollDirection(page) {
  page = page || document;
  page.querySelectorAll("[data-marquee-scroll-direction-target]").forEach(e => {
    let t = e.querySelector("[data-marquee-collection-target]"),
      r = e.querySelector("[data-marquee-scroll-target]");
    if (!t || !r) return;
    let {
      marqueeSpeed: a,
      marqueeDirection: i,
      marqueeDuplicate: l,
      marqueeScrollSpeed: o
    } = e.dataset, n = parseFloat(a), c = "right" === i ? 1 : -1, d = parseInt(l || 0), u = parseFloat(o), s = window.innerWidth < 479 ? .25 : window.innerWidth < 991 ? .5 : 1, $ = n * (t.offsetWidth / window.innerWidth) * s;
    if (r.style.marginLeft = `${-1 * u}%`, r.style.width = `${2 * u + 100}%`, d > 0) {
      let m = page.createDocumentFragment();
      for (let q = 0; q < d; q++) m.appendChild(t.cloneNode(!0));
      r.appendChild(m)
    }
    let _ = e.querySelectorAll("[data-marquee-collection-target]"),
      g = gsap.to(_, {
        xPercent: -100,
        repeat: -1,
        duration: $,
        ease: "linear"
      }).totalProgress(.5);
    gsap.set(_, {
      xPercent: 1 === c ? 100 : -100
    }), g.timeScale(c), g.play(), e.setAttribute("data-marquee-status", "normal"), ScrollTrigger.create({
      trigger: e,
      start: "top bottom",
      end: "bottom top",
      onUpdate(t) {
        let r = 1 === t.direction;
        g.timeScale(r ? -c : c), e.setAttribute("data-marquee-status", r ? "normal" : "inverted")
      }
    });
    let p = gsap.timeline({
      scrollTrigger: {
        trigger: e,
        start: "0% 100%",
        end: "100% 0%",
        scrub: 0
      }
    }),
      S = -1 === c ? u : -u;
    p.fromTo(r, {
      x: `${S}vw`
    }, {
      x: `${-S}vw`,
      ease: "none"
    })
  })
}

function initDemoSectionForm() {
  const form = document.querySelector('#wf-form-Demo-Submission');
  if (!form) return;

  let artistNameInput = form.querySelector('input[name="Artist"]');
  let songNameInput = form.querySelector('input[name="Track-Name"]');
  let subbmissionChannelSelect = form.querySelector('select[name="Submission-Channel"]');
  let submissonChannel = subbmissionChannelSelect.options[subbmissionChannelSelect.selectedIndex].text;

  let newFormName = "[7Clouds Demo Submission] " + (artistNameInput.value ? `${artistNameInput.value}` : "") + " - " + (songNameInput.value ? `${songNameInput.value}` : "") + " (" + (submissonChannel ? `${submissonChannel}` : "") + ")";

  if (DEBUG) console.log("Form Submitted with name: ", newFormName);
  
  form.setAttribute("data-name", newFormName);

}

// function formNameGenerator(page) {
//   page = page || document;
//   const form = page.querySelector('#wf-form-Demo-Submission');
//   if (!form) return;
//   const uuid = crypto.randomUUID(); // secure unique ID
//   const formName = form.getAttribute("name") || "7Clouds Demo Submission";
//   const newFormName = `${formName} #${uuid}`;
//   form.setAttribute("data-name", newFormName);
// }


// HOME
class AudioStemsPlayer{constructor(t={}){this.config={basePath:t.basePath||"https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/",stems:t.stems||[{name:"synth",file:"69650b64703b50c5ff6bae5c_synth.mp3",triggerAt:0,initialGain:1},{name:"vocals",file:"69650b649b1c1def639b4e2f_vocals.mp3",triggerAt:.2,initialGain:0},{name:"bass",file:"69650b640c593a7a72a650fc_bass.mp3",triggerAt:.55,initialGain:0},{name:"drums",file:"69650b64ea9113fff0233159_drums.mp3",triggerAt:.85,initialGain:0}],fadeDuration:t.fadeDuration||2,masterVolume:t.masterVolume||.8,debug:t.debug||!1},this.audioContext=null,this.masterGain=null,this.stemNodes=new Map,this.isPlaying=!1,this.isLoaded=!1,this.isMuted=!1,this.loadProgress=0,this.onLoadProgress=t.onLoadProgress||null,this.onReady=t.onReady||null,this.onError=t.onError||null,this.handleVisibilityChange=this.handleVisibilityChange.bind(this)}async init(){if(this.isLoaded)return this.audioContext&&"suspended"===this.audioContext.state&&await this.audioContext.resume(),this.log("Audio system already initialized, resuming"),!0;try{return this.audioContext=new(window.AudioContext||window.webkitAudioContext),this.masterGain=this.audioContext.createGain(),this.masterGain.gain.value=this.config.masterVolume,this.masterGain.connect(this.audioContext.destination),await this.loadStems(),document.addEventListener("visibilitychange",this.handleVisibilityChange),this.isLoaded=!0,this.log("Audio system initialized"),this.onReady&&this.onReady(),!0}catch(t){return DEBUG?console.error("AudioStemsPlayer init error:",t):'',this.onError&&this.onError(t),!1}}async loadStems(){let t=this.config.stems.length,i=0,e=this.config.stems.map(async e=>{try{let s=this.config.basePath+e.file,a=await fetch(s);if(!a.ok)throw Error(`Failed to load ${e.file}: ${a.status}`);let o=await a.arrayBuffer(),n=await this.audioContext.decodeAudioData(o),r=this.audioContext.createGain();r.gain.value=e.initialGain,r.connect(this.masterGain),this.stemNodes.set(e.name,{buffer:n,source:null,gain:r,config:e,currentGain:e.initialGain}),i++,this.loadProgress=i/t,this.onLoadProgress&&this.onLoadProgress(this.loadProgress,e.name),this.log(`Loaded: ${e.name} (${Math.round(100*this.loadProgress)}%)`)}catch(u){throw DEBUG?console.error(`Error loading stem ${e.name}:`,u):'',u}});await Promise.all(e),this.log("All stems loaded")}play(t=0){if(!this.isLoaded){this.log("Cannot play: not loaded");return}if(this.isPlaying){"suspended"===this.audioContext.state&&(this.audioContext.resume(),this.log("Resumed suspended context"));return}"suspended"===this.audioContext.state&&this.audioContext.resume();let i=this.audioContext.currentTime+.1,e=1/0;this.stemNodes.forEach(t=>{t.buffer.duration<e&&(e=t.buffer.duration)}),this.masterLoopDuration=e,this.masterGain.gain.setValueAtTime(0,i),this.masterGain.gain.linearRampToValueAtTime(this.config.masterVolume,i+1.5),this.playbackStartTime=i,this.playbackOffset=t,this.stemNodes.forEach((e,s)=>{let a=this.audioContext.createBufferSource();a.buffer=e.buffer,a.loop=!0,a.loopEnd=this.masterLoopDuration,a.connect(e.gain),a.start(i,t%this.masterLoopDuration),e.source=a,this.log(`Started: ${s} at offset ${t.toFixed(2)}s`)}),this.isPlaying=!0,this.log("Playback started with fade in")}stop(){this.isPlaying&&(this.stemNodes.forEach((t,i)=>{if(t.source){try{t.source.stop()}catch(e){}t.source=null}}),this.isPlaying=!1,this.log("Playback stopped"))}setStemGain(t,i,e=this.config.fadeDuration){let s=this.stemNodes.get(t);if(!s){DEBUG?console.warn(`Stem not found: ${t}`):'';return}let a=s.gain.gain,o=this.audioContext.currentTime;e>0?(a.cancelScheduledValues(o),a.setValueAtTime(a.value,o),a.linearRampToValueAtTime(i,o+e)):a.setValueAtTime(i,o),s.currentGain=i,this.log(`${t} gain -> ${i} (${e}s fade)`)}updateFromScroll(t){this.isLoaded&&this.isPlaying&&this.config.stems.forEach(i=>{let e=this.stemNodes.get(i.name);if(!e)return;let s;if(0===i.triggerAt)s=1;else{let a=i.triggerAt-.05,o=i.triggerAt+.05;s=t<a?0:t>o?1:(t-a)/.1}Math.abs(e.currentGain-s)>.01&&this.setStemGain(i.name,s,.3)})}setMasterVolume(t,i=1){if(!this.masterGain)return;let e=this.audioContext.currentTime;this.masterGain.gain.cancelScheduledValues(e),this.masterGain.gain.setValueAtTime(this.masterGain.gain.value,e),this.masterGain.gain.linearRampToValueAtTime(t,e+i),this.config.masterVolume=t,this.log(`Master volume -> ${t} (${i}s fade)`)}

toggleMute(){return this.isMuted=!this.isMuted,this.audioContext&&"suspended"===this.audioContext.state&&this.audioContext.resume(),this.isMuted?(this._volumeBeforeMute=this.config.masterVolume||.8,this.setMasterVolume(0)):this.setMasterVolume(this._volumeBeforeMute||.8),this.isMuted}

handleVisibilityChange(){if(!this.audioContext||!this.isPlaying)return;let t=this.audioContext.currentTime;if(document.hidden){if(this.playbackStartTime&&this.masterLoopDuration){let i=t-this.playbackStartTime+(this.playbackOffset||0);this._suspendedPosition=i%this.masterLoopDuration}"running"!==this.audioContext.state||this.isMuted||(this.masterGain.gain.cancelScheduledValues(t),this.masterGain.gain.setValueAtTime(this.masterGain.gain.value,t),this.masterGain.gain.linearRampToValueAtTime(0,t+.5),this._visibilityTimeout=setTimeout(()=>{document.hidden&&this.audioContext&&"running"===this.audioContext.state&&(this.audioContext.suspend(),this.log("Audio suspended (tab hidden)"))},500))}else if(this._visibilityTimeout&&(clearTimeout(this._visibilityTimeout),this._visibilityTimeout=null),void 0!==this._suspendedPosition){this.log(`Resyncing stems at position ${this._suspendedPosition.toFixed(2)}s`),this.stemNodes.forEach(t=>{if(t.source){try{t.source.stop()}catch(i){}t.source=null}}),this.isPlaying=!1;let e=()=>{this.play(this._suspendedPosition),this._suspendedPosition=void 0,this.log("Audio resynced and resumed (tab visible)")};"suspended"===this.audioContext.state?this.audioContext.resume().then(e):e()}else"suspended"===this.audioContext.state?this.audioContext.resume().then(()=>{if(!this.isMuted){let t=this.audioContext.currentTime;this.masterGain.gain.cancelScheduledValues(t),this.masterGain.gain.setValueAtTime(0,t),this.masterGain.gain.linearRampToValueAtTime(this.config.masterVolume,t+.5)}this.log("Audio resumed with fade in (tab visible)")}):this.isMuted||(this.masterGain.gain.cancelScheduledValues(t),this.masterGain.gain.setValueAtTime(this.masterGain.gain.value,t),this.masterGain.gain.linearRampToValueAtTime(this.config.masterVolume,t+.5),this.log("Audio faded in (tab visible)"))}getCurrentTime(){if(!this.audioContext||!this.isPlaying)return 0;let t=this.stemNodes.values().next().value;return t&&t.buffer?this.audioContext.currentTime%t.buffer.duration:0}getStemInfo(){let t=[];return this.stemNodes.forEach((i,e)=>{t.push({name:e,gain:i.currentGain,triggerAt:i.config.triggerAt})}),t}destroy(){this.stop(),document.removeEventListener("visibilitychange",this.handleVisibilityChange),this.audioContext&&(this.audioContext.close(),this.audioContext=null),this.stemNodes.clear(),this.isLoaded=!1,this.log("Audio system destroyed")}log(...t){this.config.debug}}

function initAudioStemsWithScroll(t={}){player=new AudioStemsPlayer({debug:DEBUG,...t});window.audioStemsPlayer=player;let e=0;return{player:player,async start(){let t=await player.init();return t&&(function t(){if("undefined"==typeof ScrollTrigger){DEBUG?console.warn("ScrollTrigger not found, scroll-based audio disabled"):'';return}ScrollTrigger.create({trigger:document.body,start:"top top",end:"bottom bottom",onUpdate(t){e=t.progress,player.updateFromScroll(e)}})}(),player.play(),player.updateFromScroll(e)),t},toggleMute:()=>player.toggleMute(),setVolume(t){player.setMasterVolume(t)},stop(){player.stop()},isReady:()=>player.isLoaded,isPlaying:()=>player.isPlaying}}

// function initHomeAudio() {let e=document.getElementById("audioEnableBtn"),t=document.getElementById("audioMuteBtn"),i=null,a=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||window.innerWidth<=991;if(a){let n=document.querySelector(".audio-control");n&&(n.style.display="none");return}i=initAudioStemsWithScroll({basePath:"https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/",stems:[{name:"synth",file:"69650b64703b50c5ff6bae5c_synth.mp3",triggerAt:0,initialGain:1},{name:"bass",file:"69650b640c593a7a72a650fc_bass.mp3",triggerAt:0,initialGain:1},{name:"backing-vocals",file:"69650b64516153731e7d9985_backing-vocals.mp3",triggerAt:.2,initialGain:0},{name:"vocals",file:"69650b649b1c1def639b4e2f_vocals.mp3",triggerAt:.2,initialGain:0},{name:"drums",file:"69650b64ea9113fff0233159_drums.mp3",triggerAt:.4,initialGain:0}],fadeDuration:2,masterVolume:.8,debug:DEBUG,onLoadProgress(e,t){},onReady(){},onError(t){console.error("Audio error:",t),e.querySelector("span").textContent="Audio Error"}}),e.addEventListener("click",async()=>{e.classList.add("loading"),e.querySelector("span").textContent="Loading...";try{let a=await i.start();a?(e.classList.add("hidden"),t.classList.add("visible"),localStorage.setItem("7clouds-audio-enabled","true")):(e.querySelector("span").textContent="Try Again",e.classList.remove("loading"))}catch(n){console.error("Failed to start audio:",n),e.querySelector("span").textContent="Try Again",e.classList.remove("loading")}}),t.addEventListener("click",()=>{let e=i.toggleMute();t.classList.toggle("muted",e)})};

function initHomeAudio() {
  let e = document.getElementById("audioEnableBtn"),
    t = document.getElementById("audioMuteBtn"),
    i = null,
    a = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 991;
  if (a) {
    let n = document.querySelector(".audio-control");
    n && (n.style.display = "none");
    return
  }
  i = initAudioStemsWithScroll({
    basePath: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/",
    stems: [{
      name: "synth",
      file: "69650b64703b50c5ff6bae5c_synth.mp3",
      triggerAt: 0,
      initialGain: 1
    }, {
      name: "bass",
      file: "69650b640c593a7a72a650fc_bass.mp3",
      triggerAt: 0,
      initialGain: 1
    }, {
      name: "backing-vocals",
      file: "69650b64516153731e7d9985_backing-vocals.mp3",
      triggerAt: .2,
      initialGain: 0
    }, {
      name: "vocals",
      file: "69650b649b1c1def639b4e2f_vocals.mp3",
      triggerAt: .2,
      initialGain: 0
    }, {
      name: "drums",
      file: "69650b64ea9113fff0233159_drums.mp3",
      triggerAt: .4,
      initialGain: 0
    }],
    fadeDuration: 2,
    masterVolume: .8,
    debug: DEBUG,
    onLoadProgress(e, t) { },
    onReady() { },
    onError(t) {
      console.error("Audio error:", t), e.querySelector("span").textContent = "Audio Error"
    }
  }), e.addEventListener("click", async () => {
    e.classList.add("loading"), e.querySelector("span").textContent = "Loading...";
    try {
      let a = await i.start();
      a ? (e.classList.add("hidden"), t.classList.add("visible"), localStorage.setItem("7clouds-audio-enabled", "true")) : (e.querySelector("span").textContent = "Try Again", e.classList.remove("loading"))
    } catch (n) {
      DEBUG ? console.error("Failed to start audio:", n) : '', e.querySelector("span").textContent = "Try Again", e.classList.remove("loading")
    }
  }), t.addEventListener("click", () => {
    let e = i.toggleMute();
    t.classList.toggle("muted", e)
  })
};


function isMobileOrTablet() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  const mobileRegex = /android|iphone|ipod|blackberry|iemobile|opera mini/i;
  const tabletRegex = /ipad|tablet|kindle|playbook|silk/i;

  const isMobile = mobileRegex.test(ua);
  const isTablet = tabletRegex.test(ua);

  // Fallback: treat small screens as mobile/tablet
  const isSmallScreen = window.matchMedia("(max-width: 991px)").matches;

  return isMobile || isTablet || isSmallScreen;
}

function initNavTooltips() {
  const nav = document.querySelector('[data-navigation]');
  if (!nav) return;

  const tooltipElements = nav.querySelectorAll('[data-css-tooltip-hover]');
  let timeoutId = null;

  tooltipElements.forEach((element) => {
    element.addEventListener('mouseenter', () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      nav.style.overflow = 'visible';
    });

    element.addEventListener('mouseleave', () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        nav.style.overflow = 'clip';
        timeoutId = null;
      }, 400);
    });
  });
}

// ARTICLE RELATED FUNCTIONS

function initArticleItemHoverAnimation(page) {

  const articleItems = page.querySelectorAll('[data-article-item]');

  if (articleItems.length === 0) return;

  articleItems.forEach((article) => {

    const articleBackground = article.querySelector('[data-article-background]');

    article.addEventListener('mouseenter', () => {

      gsap.to(articleBackground, {
        scale: 1.05,
        duration: 0.3,
        ease: "articleBackgroundScale"
      });

    })

    article.addEventListener('mouseleave', () => {

      gsap.to(articleBackground, {
        scale: 1,
        duration: 0.3,
        ease: "articleBackgroundScale"
      });

    })

  });

}

function hideDuplicateArticleFromMoreArticlesSection(page) {

  const mainElement = page.querySelector('[data-main-article-slug]');
  if (!mainElement) return;

  const slug = mainElement.getAttribute('data-main-article-slug');
  if (!slug) return;

  const targetElement = page.querySelector(`[data-article-slug="${CSS.escape(slug)}"]`);

  if (!targetElement || !targetElement.parentElement) return;

  targetElement.parentElement.appendChild(targetElement);

}

function replaceRichTextButtons(page) {

  const articleBodies = page.querySelectorAll('[data-article-body]');
  const template = page.querySelector('[data-article-button-template]');

  if (!template || articleBodies.length === 0) {
    return;
  }

  articleBodies.forEach((body) => {
    const richLinks = body.querySelectorAll('a[data-rich-text-button]');

    richLinks.forEach((link) => {
      replaceLinkWithTemplate(link, template);
    });
  });

  /**
   * Replaces a single link with a cloned template.
   * @param {HTMLAnchorElement} link
   * @param {HTMLElement} template
   */
  function replaceLinkWithTemplate(link, template) {
    const href = link.getAttribute('href');
    const text = link.textContent?.trim() || '';

    if (!href) {
      return;
    }

    const clonedTemplate = template.cloneNode(true);

    clonedTemplate.removeAttribute('data-article-button-template');

    clonedTemplate.setAttribute('href', href);

    const textContainer = clonedTemplate.querySelector('[data-article-button-template-text]');

    if (textContainer) {
      textContainer.textContent = text;
      textContainer.removeAttribute('data-article-button-template-text');
    }

    link.replaceWith(clonedTemplate);
  }

}
