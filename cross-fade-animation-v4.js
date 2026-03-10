// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

// HoF code too long, needs to be loaded separate
// import initHallOfFame from "https://cdn.jsdelivr.net/gh/AVOSSSigmaTeam/public.test/hall-of-fame.js";
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

import initSpotlightSection from "https://cdn.jsdelivr.net/gh/AVOSSSigmaTeam/public.test/spotligh-section-animation.min.js";
import initDemoSection from "https://cdn.jsdelivr.net/gh/AVOSSSigmaTeam/public.test/demo-section-animation.min.js";

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
gsap.defaults({ ease: "osmo", duration: durationDefault });


let cmsFilterInstance = null;


// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Runs once on first load
  // if (has('[data-something]')) initSomething();
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


  const pageName = nextPage.getAttribute("data-page-name") || ''; console.log(pageName);

  if (pageName == 'home') {

    initSpotlightSection();
    initDemoSection();

  } else if (pageName == 'articles') {

    // initCMSFilter();

  } else if (pageName == 'hall-of-fame') {

    // TODO init hall of fame page

    initHallOfFamePreload(nextPage);

    initHallOfFame(nextPage);
    // initHOF();
    // initHallOfFame();

  }


  const pageType = nextPage.getAttribute("data-barba-namespace") || ''; console.log(pageType);

  if (pageType == 'article') {
    initArticleItemHoverAnimation(nextPage);
    replaceRichTextButtons(nextPage);
    hideDuplicateArticleFromMoreArticlesSection(nextPage);
  }


  const animatedEmployeeAvatars = document.querySelectorAll('[data-animate-employee-avatar]');
  if (animatedEmployeeAvatars.length !== 0) {
    initAnimatedEmployeeAvatars(animatedEmployeeAvatars);
  }


  initSimpleElementAnimations();


  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }

}



// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

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

  tl.fromTo(next.querySelector('h1'), {
    yPercent: 25,
    autoAlpha: 0,
  }, {
    yPercent: 0,
    autoAlpha: 1,
    ease: "expo.out",
    duration: 1,
  }, "< 0.3");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}



// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

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
  checkNavSubmitDemoButton(data.next.container);
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
      // console.warn('Finsweet restart error:', e);
    }
  }

  //Make form submit button work
  initFormSubmitButtonHoverAnimation(data.next.container);

  // Settle
  if(hasLenis){
    lenis.resize();
    lenis.start();
  }

  if(hasScrollTrigger){
    ScrollTrigger.refresh();
  }

});

barba.init({
  debug: true, // Set to 'false' in production
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



// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

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



// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------

function initAnimatedEmployeeAvatars(avatars) {

  // const avatars = document.querySelectorAll('[data-animate-employee-avatar]');
  // if (avatars.length === 0) return;
  let i = 0;
  const animationDelay = 2500; //in ms
  setInterval(function() {

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

function initButtonHoverAnimation() {
  
  const allButtons = document.querySelectorAll('[data-animate-button]');

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

      submitButton.click();

    })

  });

}

function initSimpleElementAnimations() {

  // gsap.registerPlugin(ScrollTrigger, SplitText);

  initButtonHoverAnimation();

  const fadeInElements = document.querySelectorAll('[data-animate-fade-in]');
  const fadeInDefaultDelay = 0.4;

  fadeInElements.forEach((element) => {

    let elementDelay = parseFloat(element.getAttribute('data-animate-fade-in') || fadeInDefaultDelay);

    gsap.to(element, {
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.5,
      delay: elementDelay,
      ease: "power1.out",
      scrollTrigger: {
        markers: true,
        trigger: element,
        start: "top bottom",
        toggleActions: "play none none none"
      }
    });

  });


  const slideInFromBottom = document.querySelectorAll("[data-animate-slide-in-from-bottom]");

  if (slideInFromBottom.length !== 0){
    gsap.from(slideInFromBottom, {
      opacity: 0,
      yPercent: 50,
      duration: 0.5,
      delay: 0.3,
      ease: "power1.out",
      stagger: 0.1,
      scrollTrigger: {
        trigger: slideInFromBottom[0], // group trigger
        start: "top bottom",
        toggleActions: "play none none none"
      }
    });
  }


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
        toggleActions: "play none none none"
      }
    })

  })

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

function checkNavSubmitDemoButton(page) {

  return;

  console.log("Check Nav Init");

  const button = document.querySelector('[data-nav-submit-demo-button]') || '';
  if (button === '') return;

  const buttonLink = button.getAttribute('href');

  const submitDemoSection = page.querySelector('[id="submit-demo"]') || '';

  if (submitDemoSection != '') { //if submit demo section exists

    //check if link is anchor, if not set as anchor
    if (buttonLink !== "#submit-demo") {
      button.setAttribute('href', "#submit-demo");
      console.log("Check Nav - Set Anchor");
      return;
    }

  }
  // else { //if demo section doesn't exist on page

    //check if link is to home anchor, if not set
    if (buttonLink.endsWith("/#submit-demo")) {
      button.setAttribute('href', "/#submit-demo");
      console.log("Check Nav - Set Absolute");
    }

  // }

}

// ARTICLE RELATED FUNCTIONS

function initArticleItemHoverAnimation(page) {

  const articleItems = page.querySelectorAll('[data-article-item]');

  if (articleItems.length === 0) return;

  CustomEase.create("articleBackgroundScale", "0.25, 0.46, 0.45, 0.94");

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



// HoF

function initHallOfFame() {

    const projects = [
        {
            artist: "Imagine Dragons",
            song: "Believer",
            views: "669M",
            youtubeId: "W0DM5lcj6mw",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d37d829cb7e4c1821_01-Imagine-Dragons-Believer.jpg",
        },
        {
            artist: "The Chainsmokers ft. Halsey",
            song: "Closer",
            views: "497M",
            youtubeId: "25ROFXjoaAU",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d5269d6c69f4e1508_02-Chainsmokers-Closer.jpg",
        },
        {
            artist: "Lil Nas X",
            song: "MONTERO",
            views: "366M",
            youtubeId: "nsXwi67WgOo",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007ddc97d40f5788c6fc_03-Lil-Nas-X-Montero.jpg",
        },
        {
            artist: "Maroon 5",
            song: "Memories",
            views: "341M",
            youtubeId: "o2DXt11SMNI",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d1bcfef3d216bd2a7_04-Maroon5-Memories.jpg",
        },
        {
            artist: "Tom Odell",
            song: "Another Love",
            views: "326M",
            youtubeId: "Jkj36B1YuDU",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007de05152c90e19c48d_05-Tom-Odell-Another-Love.jpg",
        },
        {
            artist: "Lady Gaga & Bruno Mars",
            song: "Die With A Smile",
            views: "298M",
            youtubeId: "zgaCZOQCpp8",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d6ff7ed82d7137675_06-Lady-Gaga-Bruno-Mars-Die-With-A-Smile.jpg",
        },
        {
            artist: "Ruth B.",
            song: "Dandelions",
            views: "298M",
            youtubeId: "WgTMeICssXY",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007dc4dcedb90030882f_07-Ruth-B-Dandelions.jpg",
        },
        {
            artist: "Alan Walker",
            song: "Faded",
            views: "290M",
            youtubeId: "qdpXxGPqW-Y",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d8bf7bd06040efad5_08-Alan-Walker-Faded.jpg",
        },
        {
            artist: "Aaron Smith",
            song: "Dancin (KRONO Remix)",
            views: "275M",
            youtubeId: "Cjp6RVrOOW0",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d7986fdc19564ba7e_09-Aaron-Smith-Dancin.jpg",
        },
        {
            artist: "ZAYN & Sia",
            song: "Dusk Till Dawn",
            views: "249M",
            youtubeId: "p-eS-_olx9M",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007da805d2b0c643a2fa_10-Zayn-Sia-Dusk-Till-Dawn.jpg",
        },
        {
            artist: "Duncan Laurence ft. FLETCHER",
            song: "Arcade",
            views: "246M",
            youtubeId: "PNozaFzqOvI",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007df308299d4f96f600_11-Duncan-Laurence-Arcade.jpg",
        },
        {
            artist: "The Kid LAROI & Justin Bieber",
            song: "Stay",
            views: "244M",
            youtubeId: "yWHrYNP6j4k",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d6f468c24413df7ec_12-Kid-Laroi-Justin-Bieber-Stay.jpg",
        },
        {
            artist: "Maroon 5",
            song: "Animals",
            views: "241M",
            youtubeId: "0GVExpdmoDs",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007c96c9c859c16d8d3d_13-Maroon5-Animals.jpg",
        },
        {
            artist: "Kina ft. Adriana Proenza",
            song: "Can We Kiss Forever?",
            views: "240M",
            youtubeId: "DKbfBSrjVHA",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d3c4482000d3dbe6a_14-Kina-Can-We-Kiss-Forever.jpg",
        },
        {
            artist: "Vance Joy",
            song: "Riptide",
            views: "232M",
            youtubeId: "lYoWuaw5nSk",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d11085b8ea0211519_15-Vance-Joy-Riptide.jpg",
        },
        {
            artist: "Alan Walker & K-391 ft. Emelie Hollow",
            song: "Lily",
            views: "227M",
            youtubeId: "ox4tmEV6-QU",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007c40705a9f7449b4f1_16-Alan-Walker-Lily.jpg",
        },
        {
            artist: "Shawn Mendes & Camila Cabello",
            song: "Señorita",
            views: "219M",
            youtubeId: "dFp_b5DPIIo",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d963602a2d4c1c02b_17-Shawn-Mendes-Camila-Senorita.jpg",
        },
        {
            artist: "Billie Eilish",
            song: "bad guy",
            views: "197M",
            youtubeId: "4-TbQnONe_w",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d59bef5f1c522e6dc_18-Billie-Eilish-Bad-Guy.jpg",
        },
        {
            artist: "Ed Sheeran",
            song: "Perfect",
            views: "192M",
            youtubeId: "kPhpHvnnn0Q",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007ede46841c08f086e0_19-Ed-Sheeran-Perfect.jpg",
        },
        {
            artist: "Cardi B ft. Megan Thee Stallion",
            song: "WAP",
            views: "187M",
            youtubeId: "-GAIe9DNFcc",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d8a92a2b3cca386f7_20-Cardi-B-WAP.jpg",
        },
        {
            artist: "Lukas Graham",
            song: "7 Years",
            views: "183M",
            youtubeId: "Q0bnAmfGQC8",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007db9156315dc653f1f_21-Lukas-Graham-7-Years.jpg",
        },
        {
            artist: "Sub Urban",
            song: "Cradles",
            views: "182M",
            youtubeId: "OE140zsQ08I",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d0f170c261c3bd57a_22-Sub-Urban-Cradles.jpg",
        },
        {
            artist: "Egzod & Maestro Chives ft. Neoni",
            song: "Royalty",
            views: "175M",
            youtubeId: "oOi3oJmfz4o",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d3d8260ef3182b29a_23-Egzod-Maestro-Chives-Royalty.jpg",
        },
        {
            artist: "Clean Bandit ft. Sean Paul & Anne-Marie",
            song: "Rockabye",
            views: "172M",
            youtubeId: "2VDdP7lYiiI",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d6cfd52e1e1fabce3_24-Clean-Bandit-Rockabye.jpg",
        },
        {
            artist: "Elley Duhé",
            song: "Middle of the Night",
            views: "161M",
            youtubeId: "CfgcbCe9Z_o",
            image: "https://cdn.prod.website-files.com/695f71824ef82b1e7dd190b4/696e007d23d782ae6fc4b666_25-Elley-Duhe-Middle-of-the-Night.jpg",
        },
    ];

    const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
    const fragmentShader = `
  uniform vec2 uOffset;
  uniform vec2 uResolution;
  uniform vec4 uBorderColor;
  uniform vec4 uHoverColor;
  uniform vec4 uBackgroundColor;
  uniform vec2 uMousePos;
  uniform float uZoom;
  uniform float uCellSize;
  uniform float uTextureCount;
  uniform float uHoverIntensity;
  uniform vec2 uHoveredCellId;
  uniform sampler2D uImageAtlas;
  uniform sampler2D uArtistTextAtlas;
  uniform sampler2D uSongTextAtlas;
  varying vec2 vUv;

  // Rounded rectangle SDF for border-radius effect
  float roundedBoxSDF(vec2 p, vec2 size, float radius) {
    vec2 q = abs(p) - size + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  void main() {
    vec2 screenUV = (vUv - 0.5) * 2.0;

    // Original fisheye effect
    float radius = length(screenUV);
    float distortion = 1.0 - 0.08 * radius * radius;
    vec2 distortedUV = screenUV * distortion;

    vec2 aspectRatio = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 worldCoord = distortedUV * aspectRatio;

    worldCoord *= uZoom;
    worldCoord += uOffset;

    vec2 cellPos = worldCoord / uCellSize;
    vec2 cellId = floor(cellPos);
    vec2 cellUV = fract(cellPos);

    vec2 mouseScreenUV = (uMousePos / uResolution) * 2.0 - 1.0;
    mouseScreenUV.y = -mouseScreenUV.y;

    // Original fisheye for mouse position
    float mouseRadius = length(mouseScreenUV);
    float mouseDistortion = 1.0 - 0.08 * mouseRadius * mouseRadius;
    vec2 mouseDistortedUV = mouseScreenUV * mouseDistortion;
    vec2 mouseWorldCoord = mouseDistortedUV * aspectRatio;

    mouseWorldCoord *= uZoom;
    mouseWorldCoord += uOffset;

    vec2 mouseCellPos = mouseWorldCoord / uCellSize;
    vec2 mouseCellId = floor(mouseCellPos);

    // Check if this is the hovered cell (tracked by JavaScript)
    bool isHoveredCell = (cellId.x == uHoveredCellId.x && cellId.y == uHoveredCellId.y);

    // Use the animated hover intensity from JavaScript
    float smoothHover = isHoveredCell ? uHoverIntensity : 0.0;

    vec3 backgroundColor = uBackgroundColor.rgb;

    // HORIZONTAL GRID LINES ONLY
    float lineWidth = 0.005;
    float gridY = smoothstep(0.0, lineWidth, cellUV.y) * smoothstep(0.0, lineWidth, 1.0 - cellUV.y);
    float gridMask = gridY;  // Only horizontal lines

    // Image sizing for 16:9 YouTube thumbnails
    float imageWidth = 0.7;
    float imageHeight = imageWidth * 0.5625;  // 16:9 aspect ratio
    float imageBorderX = (1.0 - imageWidth) * 0.5;
    float imageBorderY = (1.0 - imageHeight) * 0.5;

    vec2 imageUV = vec2(
      (cellUV.x - imageBorderX) / imageWidth,
      (cellUV.y - imageBorderY) / imageHeight
    );

    // BORDER-RADIUS for images - using rounded rectangle SDF
    vec2 centeredUV = imageUV - 0.5;
    float cornerRadius = 0.08;
    float halfSize = 0.5;

    float dist = roundedBoxSDF(centeredUV, vec2(halfSize, halfSize), cornerRadius);

    float edgeSmooth = 0.01;
    float roundedMask = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, dist);

    bool inImageArea = imageUV.x >= 0.0 && imageUV.x <= 1.0 && imageUV.y >= 0.0 && imageUV.y <= 1.0;

    // TEXT AREAS - Artist at top, Song at bottom
    float textHeight = 0.08;
    float artistTextY = 0.90;  // Top position for artist
    float songTextY = 0.02;    // Bottom position for song

    bool inArtistTextArea = cellUV.x >= 0.05 && cellUV.x <= 0.95 && cellUV.y >= artistTextY && cellUV.y <= (artistTextY + textHeight);
    bool inSongTextArea = cellUV.x >= 0.05 && cellUV.x <= 0.95 && cellUV.y >= songTextY && cellUV.y <= (songTextY + textHeight);

    // Calculate texture index - use simple mod like original
    float texIndex = mod(cellId.x + cellId.y * 3.0, uTextureCount);

    vec3 color = backgroundColor;

    // Get atlas coordinates for this cell's image
    float atlasSize = ceil(sqrt(uTextureCount));
    vec2 atlasPos = vec2(mod(texIndex, atlasSize), floor(texIndex / atlasSize));

    // HOVER: Fill entire cell background with darkened image (smooth fade)
    if (smoothHover > 0.0) {
      // Sample the image at cellUV coordinates to fill the whole cell
      // Flip cellUV.y to correct image orientation, but keep atlasPos row correct
      vec2 flippedCellUV = vec2(cellUV.x, 1.0 - cellUV.y);
      vec2 bgAtlasUV = (atlasPos + flippedCellUV) / atlasSize;
      vec3 bgImageColor = texture2D(uImageAtlas, bgAtlasUV).rgb;
      // Apply dark overlay (60% darkening) with smooth fade
      vec3 darkBgColor = bgImageColor * 0.4;
      backgroundColor = mix(uBackgroundColor.rgb, darkBgColor, smoothHover);
      color = backgroundColor;
    }

    // Apply rounded mask to main image
    if (inImageArea && roundedMask > 0.0) {
      // Flip imageUV.y to correct image orientation, but keep atlasPos row correct
      vec2 flippedImageUV = vec2(imageUV.x, 1.0 - imageUV.y);
      vec2 atlasUV = (atlasPos + flippedImageUV) / atlasSize;

      vec3 imageColor = texture2D(uImageAtlas, atlasUV).rgb;
      color = mix(color, imageColor, roundedMask);
    }

    // Artist text at top
    if (inArtistTextArea) {
      vec2 textCoord = vec2((cellUV.x - 0.05) / 0.9, (cellUV.y - artistTextY) / textHeight);
      textCoord.y = 1.0 - textCoord.y;

      vec2 atlasUV = (atlasPos + textCoord) / atlasSize;

      vec4 textColor = texture2D(uArtistTextAtlas, atlasUV);

      color = mix(color, textColor.rgb, textColor.a);
    }

    // Song text at bottom
    if (inSongTextArea) {
      vec2 textCoord = vec2((cellUV.x - 0.05) / 0.9, (cellUV.y - songTextY) / textHeight);
      textCoord.y = 1.0 - textCoord.y;

      vec2 atlasUV = (atlasPos + textCoord) / atlasSize;

      vec4 textColor = texture2D(uSongTextAtlas, atlasUV);

      color = mix(color, textColor.rgb, textColor.a);
    }

    // Apply horizontal grid lines
    vec3 borderRGB = uBorderColor.rgb;
    float borderAlpha = uBorderColor.a;
    color = mix(color, borderRGB, (1.0 - gridMask) * borderAlpha);

    float fade = 1.0 - smoothstep(0.9, 1.5, radius);

    gl_FragColor = vec4(color * fade, 1.0);
  }
`;

    // 7clouds Color Scheme
    const config = {
        cellSize: 0.75,
        zoomLevel: 1.25,
        lerpFactor: 0.075,
        defaultZoom: 0.85,  // Zoomed in view (lower = more zoomed in)
        borderColor: "rgba(255, 255, 255, 0.10)",  // glass-border-strong
        backgroundColor: "rgba(0, 0, 0, 1)",        // pure black #000
        textColor: "rgba(255, 255, 255, 1)",       // pure white
        hoverColor: "rgba(255, 255, 255, 0.06)",   // --glass-medium
    };

    let scene, camera, renderer, plane;
    let isDragging = false,
        isClick = true,
        clickStartTime = 0;
    let previousMouse = { x: 0, y: 0 };
    // Start offset to center a row with half-rows visible above/below
    const initialOffsetY = 0.375;  // Half cell size to show partial rows   
    let offset = { x: 0, y: initialOffsetY },
        targetOffset = { x: 0, y: initialOffsetY };
    let mousePosition = { x: -1, y: -1 };
    let zoomLevel = 0.85,
        targetZoom = 0.85;
    let hoverIntensity = 0;
    let currentHoveredCell = { x: -999, y: -999 };
    let artistTextTextures = [];
    let songTextTextures = [];

    const rgbaToArray = (rgba) => {
        const match = rgba.match(/rgba?\(([^)]+)\)/);
        if (!match) return [1, 1, 1, 1];
        return match[1]
            .split(",")
            .map((v, i) =>
                i < 3 ? parseFloat(v.trim()) / 255 : parseFloat(v.trim() || 1)
            );
    };

    // Create artist text texture (for top of cell)
    const createArtistTextTexture = (artist) => {
        const canvas = document.createElement("canvas");
        canvas.width = 2048;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, 2048, 256);
        ctx.font = "700 70px Switzer, Arial, sans-serif";
        ctx.fillStyle = config.textColor;
        ctx.textBaseline = "middle";
        ctx.imageSmoothingEnabled = false;

        ctx.textAlign = "left";
        ctx.fillText(artist.toUpperCase(), 30, 128);

        const texture = new THREE.CanvasTexture(canvas);
        Object.assign(texture, {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            flipY: false,
            generateMipmaps: false,
            format: THREE.RGBAFormat,
        });

        return texture;
    };

    // Create song + views text texture (for bottom of cell)
    const createSongTextTexture = (song, views) => {
        const canvas = document.createElement("canvas");
        canvas.width = 2048;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, 2048, 256);
        ctx.font = "700 80px Switzer, Arial, sans-serif";
        ctx.fillStyle = config.textColor;
        ctx.textBaseline = "middle";
        ctx.imageSmoothingEnabled = false;

        ctx.textAlign = "left";
        ctx.fillText(song.toUpperCase(), 30, 128);

        // Draw views with circle icon on the right
        ctx.textAlign = "right";
        const viewsText = views + "+";
        ctx.fillText(viewsText, 2048 - 30, 128);

        // Draw circle icon before views
        const viewsWidth = ctx.measureText(viewsText).width;
        const circleX = 2048 - 30 - viewsWidth - 50;
        const circleY = 128;
        const circleRadius = 28;

        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = config.textColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw play icon inside circle
        ctx.beginPath();
        ctx.moveTo(circleX - 8, circleY - 14);
        ctx.lineTo(circleX - 8, circleY + 14);
        ctx.lineTo(circleX + 14, circleY);
        ctx.closePath();
        ctx.fillStyle = config.textColor;
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        Object.assign(texture, {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            flipY: false,
            generateMipmaps: false,
            format: THREE.RGBAFormat,
        });

        return texture;
    };

    const createTextureAtlas = (textures, isText = false) => {
        const atlasSize = Math.ceil(Math.sqrt(textures.length));
        const textureSize = 512;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = atlasSize * textureSize;
        const ctx = canvas.getContext("2d");

        if (isText) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        textures.forEach((texture, index) => {
            const x = (index % atlasSize) * textureSize;
            const y = Math.floor(index / atlasSize) * textureSize;

            if (isText && texture.source?.data) {
                ctx.drawImage(texture.source.data, x, y, textureSize, textureSize);
            } else if (!isText && texture.image?.complete) {
                ctx.drawImage(texture.image, x, y, textureSize, textureSize);
            }
        });

        const atlasTexture = new THREE.CanvasTexture(canvas);
        Object.assign(atlasTexture, {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            flipY: false,
        });

        return atlasTexture;
    };

    const loadTextures = () => {
        const textureLoader = new THREE.TextureLoader();
        const imageTextures = [];
        let loadedCount = 0;

        return new Promise((resolve) => {
            projects.forEach((project, index) => {
                const texture = textureLoader.load(project.image, () => {
                    if (++loadedCount === projects.length) {
                        resolve(imageTextures);
                    }
                });

                Object.assign(texture, {
                    wrapS: THREE.ClampToEdgeWrapping,
                    wrapT: THREE.ClampToEdgeWrapping,
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                });

                imageTextures.push(texture);
                artistTextTextures.push(createArtistTextTexture(project.artist));
                songTextTextures.push(createSongTextTexture(project.song, project.views));
            });
        });
    };

    const updateMousePosition = (event) => {
        if (!renderer?.domElement) return;

        const rect = renderer.domElement.getBoundingClientRect();
        mousePosition.x = event.clientX - rect.left;
        mousePosition.y = event.clientY - rect.top;

        // Only show hover effect when not dragging
        if (!isDragging) {
            plane?.material.uniforms.uMousePos.value.set(mousePosition.x, mousePosition.y);
        }
    };

    const startDrag = (x, y) => {
        isDragging = true;
        isClick = true;
        clickStartTime = Date.now();
        document.body.classList.add("dragging");
        previousMouse.x = x;
        previousMouse.y = y;
        // Disable hover effect while dragging
        plane?.material.uniforms.uMousePos.value.set(-1, -1);
        setTimeout(() => isDragging && (targetZoom = config.zoomLevel), 150);
    };

    // Check if event target is within navbar or stats bar
    const isUIElement = (target) => {
        const navbar = document.querySelector('.master-navigation');
        const statsBar = document.querySelector('.gallery-stats-bar');
        return (navbar && navbar.contains(target)) || (statsBar && statsBar.contains(target));
    };

    const onPointerDown = (e) => {
        // Don't start drag when YouTube overlay is active or clicking on UI elements
        const overlay = document.getElementById("youtube-overlay");
        if (overlay?.classList.contains("active")) return;
        if (isUIElement(e.target)) return;
        startDrag(e.clientX, e.clientY);
    };
    const onTouchStart = (e) => {
        // Don't start drag when YouTube overlay is active or touching UI elements
        const overlay = document.getElementById("youtube-overlay");
        if (overlay?.classList.contains("active")) return;
        if (isUIElement(e.target)) return;
        e.preventDefault();
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleMove = (currentX, currentY) => {
        if (!isDragging || currentX === undefined || currentY === undefined) return;

        const deltaX = currentX - previousMouse.x;
        const deltaY = currentY - previousMouse.y;

        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
            isClick = false;
            if (targetZoom === 1.0) targetZoom = config.zoomLevel;
        }

        targetOffset.x -= deltaX * 0.003;
        targetOffset.y += deltaY * 0.003;
        previousMouse.x = currentX;
        previousMouse.y = currentY;
    };

    const onPointerMove = (e) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
        // Don't interfere with touches on UI elements
        if (isUIElement(e.target)) return;
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onPointerUp = (event) => {
        isDragging = false;
        document.body.classList.remove("dragging");
        targetZoom = config.defaultZoom;

        // Don't process clicks when YouTube overlay is active or on UI elements
        const overlay = document.getElementById("youtube-overlay");
        if (overlay?.classList.contains("active")) {
            return;
        }
        if (isUIElement(event.target)) {
            return;
        }

        if (isClick && Date.now() - clickStartTime < 200) {
            const endX = event.clientX || event.changedTouches?.[0]?.clientX;
            const endY = event.clientY || event.changedTouches?.[0]?.clientY;

            if (endX !== undefined && endY !== undefined) {
                const rect = renderer.domElement.getBoundingClientRect();
                const screenX = ((endX - rect.left) / rect.width) * 2 - 1;
                const screenY = -(((endY - rect.top) / rect.height) * 2 - 1);

                const radius = Math.sqrt(screenX * screenX + screenY * screenY);
                const distortion = 1.0 - 0.08 * radius * radius;  // Original fisheye

                let worldX =
                    screenX * distortion * (rect.width / rect.height) * zoomLevel +
                    offset.x;
                let worldY = screenY * distortion * zoomLevel + offset.y;

                const cellX = Math.floor(worldX / config.cellSize);
                const cellY = Math.floor(worldY / config.cellSize);
                const texIndex = Math.floor((cellX + cellY * 3.0) % projects.length);
                const actualIndex = texIndex < 0 ? projects.length + texIndex : texIndex;

                if (projects[actualIndex]?.youtubeId) {
                    showYouTubeOverlay(projects[actualIndex]);
                }
            }
        }
    };

    // YouTube Overlay functions
    const showYouTubeOverlay = (project) => {
        // Create overlay if it doesn't exist
        let overlay = document.getElementById("youtube-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "youtube-overlay";
            overlay.innerHTML = `
      <div class="youtube-overlay-backdrop"></div>
      <div class="youtube-overlay-content">
        <div class="youtube-overlay-header">
          <div class="youtube-overlay-info">
            <span class="youtube-overlay-artist"></span>
            <span class="youtube-overlay-song"></span>
          </div>
          <div class="youtube-overlay-right">
            <button class="youtube-overlay-close">&times;</button>
            <span class="youtube-overlay-views"></span>
          </div>
        </div>
        <div class="youtube-overlay-video">
          <iframe
            id="youtube-iframe"
            frameborder="0"
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </div>
      </div>
    `;
            document.body.appendChild(overlay);

            // Add close functionality (click and touch)
            const backdrop = overlay.querySelector(".youtube-overlay-backdrop");
            const closeBtn = overlay.querySelector(".youtube-overlay-close");
            const content = overlay.querySelector(".youtube-overlay-content");

            backdrop.addEventListener("click", hideYouTubeOverlay);
            backdrop.addEventListener("touchend", (e) => {
                e.preventDefault();
                hideYouTubeOverlay();
            });

            closeBtn.addEventListener("click", hideYouTubeOverlay);
            closeBtn.addEventListener("touchend", (e) => {
                e.preventDefault();
                hideYouTubeOverlay();
            });

            // Close when clicking/touching anywhere on overlay (but not on video/content)
            overlay.addEventListener("click", (e) => {
                if (e.target === overlay || e.target.classList.contains("youtube-overlay-backdrop")) {
                    hideYouTubeOverlay();
                }
            });
            overlay.addEventListener("touchend", (e) => {
                if (e.target === overlay || e.target.classList.contains("youtube-overlay-backdrop")) {
                    e.preventDefault();
                    hideYouTubeOverlay();
                }
            });

            // Prevent clicks/touches on content from bubbling to overlay
            content.addEventListener("click", (e) => {
                e.stopPropagation();
            });
            content.addEventListener("touchend", (e) => {
                e.stopPropagation();
            });

            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape") hideYouTubeOverlay();
            });
        }

        // Update content
        overlay.querySelector(".youtube-overlay-artist").textContent = project.artist;
        overlay.querySelector(".youtube-overlay-song").textContent = project.song;
        overlay.querySelector(".youtube-overlay-views").textContent = project.views + "+ Views";
        overlay.querySelector("#youtube-iframe").src =
            `https://www.youtube.com/embed/${project.youtubeId}?autoplay=1&rel=0`;

        // Show overlay and blur gallery
        overlay.classList.add("active");
        document.getElementById("gallery")?.classList.add("blurred");
        document.body.style.overflow = "hidden";
    };

    const hideYouTubeOverlay = () => {
        const overlay = document.getElementById("youtube-overlay");
        if (overlay) {
            overlay.classList.remove("active");
            overlay.querySelector("#youtube-iframe").src = "";
            document.getElementById("gallery")?.classList.remove("blurred");
            document.body.style.overflow = "";
        }
    };

    const onWindowResize = () => {
        const container = document.getElementById("gallery");
        if (!container) return;

        const { offsetWidth: width, offsetHeight: height } = container;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        plane?.material.uniforms.uResolution.value.set(width, height);
    };

    const setupEventListeners = () => {
        const gallery = document.getElementById("gallery");

        // Attach mouse events to document for drag continuity
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("mousemove", onPointerMove);
        document.addEventListener("mouseup", onPointerUp);
        document.addEventListener("mouseleave", onPointerUp);

        // Attach touch events to gallery element only - this prevents interference with navbar
        const passiveOpts = { passive: false };
        if (gallery) {
            gallery.addEventListener("touchstart", onTouchStart, passiveOpts);
            gallery.addEventListener("touchmove", onTouchMove, passiveOpts);
            gallery.addEventListener("touchend", onPointerUp, passiveOpts);
        }

        window.addEventListener("resize", onWindowResize);
        document.addEventListener("contextmenu", (e) => e.preventDefault());

        renderer.domElement.addEventListener("mousemove", updateMousePosition);
        renderer.domElement.addEventListener("mouseleave", () => {
            mousePosition.x = mousePosition.y = -1;
            plane?.material.uniforms.uMousePos.value.set(-1, -1);
        });
    };

    // Calculate which cell the mouse is over using current animated values
    const getHoveredCell = () => {
        if (!renderer?.domElement || mousePosition.x < 0) {
            return { x: -999, y: -999 };
        }

        const rect = renderer.domElement.getBoundingClientRect();
        const screenX = (mousePosition.x / rect.width) * 2 - 1;
        const screenY = -((mousePosition.y / rect.height) * 2 - 1);

        const radius = Math.sqrt(screenX * screenX + screenY * screenY);
        const distortion = 1.0 - 0.08 * radius * radius;

        const aspectRatio = rect.width / rect.height;
        const worldX = screenX * distortion * aspectRatio * zoomLevel + offset.x;
        const worldY = screenY * distortion * zoomLevel + offset.y;

        return {
            x: Math.floor(worldX / config.cellSize),
            y: Math.floor(worldY / config.cellSize)
        };
    };

    const animate = () => {
        requestAnimationFrame(animate);

        offset.x += (targetOffset.x - offset.x) * config.lerpFactor;
        offset.y += (targetOffset.y - offset.y) * config.lerpFactor;
        zoomLevel += (targetZoom - zoomLevel) * config.lerpFactor;

        // Track hovered cell and animate intensity
        if (!isDragging && mousePosition.x >= 0) {
            const newCell = getHoveredCell();

            // If cell changed, reset intensity to 0 for fade-in
            if (newCell.x !== currentHoveredCell.x || newCell.y !== currentHoveredCell.y) {
                currentHoveredCell = newCell;
                hoverIntensity = 0;
            }

            // Animate hover intensity toward 1
            hoverIntensity += (1 - hoverIntensity) * 0.08;
        } else {
            // Fade out when not hovering or dragging
            hoverIntensity += (0 - hoverIntensity) * 0.08;
            if (hoverIntensity < 0.01) {
                currentHoveredCell = { x: -999, y: -999 };
            }
        }

        if (plane?.material.uniforms) {
            plane.material.uniforms.uOffset.value.set(offset.x, offset.y);
            plane.material.uniforms.uZoom.value = zoomLevel;
            plane.material.uniforms.uHoverIntensity.value = hoverIntensity;
            plane.material.uniforms.uHoveredCellId.value.set(currentHoveredCell.x, currentHoveredCell.y);
        }

        renderer.render(scene, camera);
    };

    const init = async () => {
    // const init = () => {
        const container = document.getElementById("gallery");
        if (!container) return;

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        const bgColor = rgbaToArray(config.backgroundColor);
        renderer.setClearColor(
            new THREE.Color(bgColor[0], bgColor[1], bgColor[2]),
            bgColor[3]
        );
        container.appendChild(renderer.domElement);

        const imageTextures = await loadTextures();
        // const imageTextures = loadTextures();
        const imageAtlas = createTextureAtlas(imageTextures, false);
        const artistTextAtlas = createTextureAtlas(artistTextTextures, true);
        const songTextAtlas = createTextureAtlas(songTextTextures, true);

        const uniforms = {
            uOffset: { value: new THREE.Vector2(0, 0) },
            uResolution: {
                value: new THREE.Vector2(container.offsetWidth, container.offsetHeight),
            },
            uBorderColor: {
                value: new THREE.Vector4(...rgbaToArray(config.borderColor)),
            },
            uHoverColor: {
                value: new THREE.Vector4(...rgbaToArray(config.hoverColor)),
            },
            uBackgroundColor: {
                value: new THREE.Vector4(...rgbaToArray(config.backgroundColor)),
            },
            uMousePos: { value: new THREE.Vector2(-1, -1) },
            uZoom: { value: 1.0 },
            uCellSize: { value: config.cellSize },
            uTextureCount: { value: projects.length },
            uHoverIntensity: { value: 0.0 },
            uHoveredCellId: { value: new THREE.Vector2(-999, -999) },
            uImageAtlas: { value: imageAtlas },
            uArtistTextAtlas: { value: artistTextAtlas },
            uSongTextAtlas: { value: songTextAtlas },
        };

        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
        });

        plane = new THREE.Mesh(geometry, material);
        scene.add(plane);

        setupEventListeners();
        animate();
    };

    init();

    // Parse view counts (e.g., "669M" -> 669, "1.2B" -> 1200)
    function parseViews(viewStr) {
        const num = parseFloat(viewStr);
        if (viewStr.includes('B')) return num * 1000; // Billions to millions
        return num; // Already in millions
    }

    // Calculate total views
    const totalMillions = projects.reduce((sum, project) => {
        return sum + parseViews(project.views);
    }, 0);

    // Format the total (e.g., 6234 -> "6.2B+")
    function formatTotal(millions) {
        if (millions >= 1000) {
            return (millions / 1000).toFixed(1) + 'B+ Views';
        }
        return Math.round(millions) + 'M+ Views';
    }

    // Update the stats bar
    document.getElementById('totalViews').textContent = formatTotal(totalMillions);
};

function initHallOfFamePreload(page) {  // hall of fame preload animation

  const el = page.querySelector('[text-loader]');
  const preloader = page.querySelector('.preloader');
  const lineFill = page.querySelector('.line-fill-preloader');
  if (!el || !preloader) return;

  const counter = { value: 0 };

  el.textContent = '0%';
  lineFill.style.width = '0%';
  preloader.style.display = 'flex';

  // Create a timeline for coordinated animations
  const tl = gsap.timeline();

  // Animate counter and progress bar together
  tl.to(counter, {
    value: 100,
    duration: 2.5,
    ease: 'power2.out',
    onUpdate: () => { el.textContent = Math.floor(counter.value) + '%'; },
    onComplete: () => { el.textContent = '100%'; }
  }, 0);

  // Animate progress bar width
  if (lineFill) {
    tl.to(lineFill, {
      width: '100%',
      duration: 2.5,
      ease: 'power2.out'
    }, 0);
  }

  // Fade out and hide preloader after animation
  tl.to(preloader, {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.inOut',
    onComplete: () => {
      preloader.style.display = 'none';
    }
  }, 2.5);

}


// HoF END


