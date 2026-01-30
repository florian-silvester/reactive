console.log('🎨 Animations.js loaded');
console.log('📍 Script URL:', document.currentScript?.src || 'inline');
console.log('📍 Current page:', window.location.href);

// Load GSAP ScrollToPlugin if not already loaded
function loadScrollToPlugin() {
  return new Promise((resolve, reject) => {
    if (typeof gsap !== 'undefined' && gsap.plugins && gsap.plugins.scrollTo) {
      console.log('✅ ScrollToPlugin already loaded');
      resolve();
      return;
    }
    
    console.log('📦 Loading GSAP ScrollToPlugin...');
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollToPlugin.min.js';
    script.onload = () => {
      if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollToPlugin);
        console.log('✅ ScrollToPlugin loaded and registered');
        resolve();
      } else {
        reject('GSAP not found after loading plugin');
      }
    };
    script.onerror = () => reject('Failed to load ScrollToPlugin');
    document.head.appendChild(script);
  });
}

if (!window.barbaInitialized) {
  window.barbaInitialized = true;

  document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM Content Loaded');
    console.log('🔍 Checking dependencies:', {
      barba: typeof barba !== 'undefined',
      gsap: typeof gsap !== 'undefined'
    });
    
    if (typeof barba === 'undefined' || typeof gsap === 'undefined') {
      console.error('❌ Missing barba or gsap');
      console.error('   Barba:', typeof barba);
      console.error('   GSAP:', typeof gsap);
      return;
    }
    
    // Load ScrollToPlugin
    try {
      await loadScrollToPlugin();
    } catch (error) {
      console.error('❌ Failed to load ScrollToPlugin:', error);
      console.log('⚠️ Falling back to manual scroll (may be less smooth)');
    }

    // Auto-scroll state
    let autoScrollTween = null;
    let userScrollTimeout = null;
    let isUserScrolling = false;
    let isAutoScrolling = false; // Track if GSAP is currently scrolling
    let startScrollPosition = 0;
    let targetScrollPosition = 0;
    let lastScrollTime = 0;
    let lastScrollPosition = window.scrollY;

    function pauseAutoScroll() {
      if (autoScrollTween && autoScrollTween.isActive()) {
        autoScrollTween.pause();
        isAutoScrolling = false;
        console.log('⏸️ Auto-scroll paused (user scrolling)');
      }
    }

    function resumeAutoScroll() {
      if (autoScrollTween && !autoScrollTween.isActive() && !isUserScrolling) {
        const currentScroll = window.scrollY;
        const remainingDistance = targetScrollPosition - currentScroll;
        const totalDistance = targetScrollPosition - startScrollPosition;
        const scrollSpeed = totalDistance / 20; // pixels per second
        const remainingDuration = remainingDistance / scrollSpeed;
        
        if (remainingDistance > 0 && remainingDuration > 0) {
          // Use ScrollToPlugin if available
          if (gsap.plugins && gsap.plugins.scrollTo) {
            isAutoScrolling = true;
            autoScrollTween = gsap.to(window, {
              scrollTo: { y: targetScrollPosition, autoKill: false },
              duration: remainingDuration,
              ease: "none",
              onComplete: () => {
                isAutoScrolling = false;
                console.log('✅ Auto-scroll complete');
              }
            });
          } else {
            // Fallback
            const scrollProxy = { scroll: currentScroll };
            autoScrollTween = gsap.to(scrollProxy, {
              scroll: targetScrollPosition,
              duration: remainingDuration,
              ease: "none",
              onUpdate: () => {
                if (!isUserScrolling) {
                  window.scrollTo(0, scrollProxy.scroll);
                }
              },
              onComplete: () => {
                console.log('✅ Auto-scroll complete');
              }
            });
          }
          console.log('▶️ Auto-scroll resumed');
        }
      }
    }

    function startAutoScroll() {
      console.log('🔍 Checking if auto-scroll should start...');
      
      // Check if we're on homepage (you can adjust this selector)
      const hasHeroWrap = !!document.querySelector('.hero_wrap');
      const hasStudioSvg = !!document.querySelector('.studio_svg');
      const isRootPath = window.location.pathname === '/' || window.location.pathname === '';
      const hasHomeInPath = window.location.pathname.includes('home');
      
      console.log('📍 Homepage detection:', {
        hasHeroWrap,
        hasStudioSvg,
        isRootPath,
        hasHomeInPath,
        pathname: window.location.pathname
      });
      
      const isHomepage = hasHeroWrap || hasStudioSvg || isRootPath || hasHomeInPath;
      
      if (!isHomepage) {
        console.log('❌ Not homepage - skipping auto-scroll');
        return;
      }
      
      // Stop any existing auto-scroll
      if (autoScrollTween) {
        autoScrollTween.kill();
      }
      
      const scrollHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScroll = scrollHeight - windowHeight;
      
      console.log('📏 Scroll check:', {
        scrollHeight,
        windowHeight,
        maxScroll,
        currentScroll: window.scrollY
      });
      
      if (maxScroll <= 0) {
        console.log('❌ Page doesn\'t scroll (maxScroll <= 0)');
        return;
      }
      
      console.log('🔄 Starting auto-scroll on homepage');
      console.log(`   Will scroll from ${window.scrollY}px to ${maxScroll}px over 20 seconds`);
      
      // Store start and target positions
      startScrollPosition = window.scrollY;
      targetScrollPosition = maxScroll;
      
      // Use GSAP ScrollToPlugin for smooth scrolling
      if (gsap.plugins && gsap.plugins.scrollTo) {
        console.log('✨ Using ScrollToPlugin for smooth auto-scroll');
        isAutoScrolling = true;
        autoScrollTween = gsap.to(window, {
          scrollTo: { y: maxScroll, autoKill: false },
          duration: 20,
          ease: "none",
          onStart: () => {
            isAutoScrolling = true;
            console.log('✨ Auto-scroll animation started!');
          },
          onComplete: () => {
            isAutoScrolling = false;
            console.log('✅ Auto-scroll complete');
          }
        });
      } else {
        // Fallback to manual scroll
        const scrollProxy = { scroll: window.scrollY };
        autoScrollTween = gsap.to(scrollProxy, {
          scroll: maxScroll,
          duration: 20,
          ease: "none",
          onUpdate: () => {
            if (!isUserScrolling) {
              window.scrollTo(0, scrollProxy.scroll);
            }
          },
          onStart: () => {
            console.log('✨ Auto-scroll animation started!');
          },
          onComplete: () => {
            console.log('✅ Auto-scroll complete');
          }
        });
      }
    }

    function stopAutoScroll() {
      if (autoScrollTween) {
        autoScrollTween.kill();
        autoScrollTween = null;
        console.log('⏸️ Auto-scroll stopped');
      }
    }

    // Handle user scrolling - ONLY detect actual user input, not programmatic scrolls
    function handleUserInput() {
      // Only pause if auto-scroll is actually running
      if (!isAutoScrolling) return;
      
      isUserScrolling = true;
      pauseAutoScroll();
      
      // Clear existing timeout
      if (userScrollTimeout) {
        clearTimeout(userScrollTimeout);
      }
      
      // Resume auto-scroll after user stops scrolling for 1.5 seconds
      userScrollTimeout = setTimeout(() => {
        isUserScrolling = false;
        resumeAutoScroll();
      }, 1500);
    }
    
    // Only listen to actual user input events, NOT scroll events (which fire during GSAP scrolling)
    document.addEventListener('wheel', handleUserInput, { passive: true });
    document.addEventListener('touchstart', handleUserInput, { passive: true });
    document.addEventListener('keydown', (e) => {
      // Detect arrow keys, page up/down, spacebar
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' '].includes(e.key)) {
        handleUserInput();
      }
    }, { passive: true });

    barba.init({
      sync: true,
      preventRunning: true,
      
      transitions: [{
        name: 'crossfade',
        
        // With sync:true, enter runs while leave runs
        // We only need to fade out the current - next appears underneath
        enter(data) {
          console.log('🌅 ENTER - fading out current container');
          stopAutoScroll(); // Stop auto-scroll during transition
          return gsap.to(data.current.container, { 
            opacity: 0, 
            duration: 0.5,
            ease: "power2.out"
          });
        },
        
        afterEnter(data) {
          // Reset user scrolling state on new page
          isUserScrolling = false;
          if (userScrollTimeout) {
            clearTimeout(userScrollTimeout);
            userScrollTimeout = null;
          }
          // Start auto-scroll if on homepage
          setTimeout(() => {
            startAutoScroll();
          }, 1000); // Small delay after page transition
          
          // Initialize Landing scroll opacity animation
          setTimeout(() => {
            initLandingScrollOpacity();
          }, 500);
        }
      }]
    });

    // Start auto-scroll on initial page load
    setTimeout(() => {
      startAutoScroll();
    }, 2000); // Wait 2 seconds after page load
    
    // Initialize Landing scroll opacity animation
    setTimeout(() => {
      initLandingScrollOpacity();
    }, 1000);

    console.log('✅ Barba ready');
    
    // Expose test function for debugging
    window.testAutoScroll = startAutoScroll;
  });
}

// Standalone auto-scroll (works without Barba)
let standaloneScrollTween = null;
let standaloneUserScrollTimeout = null;
let standaloneIsUserScrolling = false;
let standaloneIsAutoScrolling = false;

function initStandaloneAutoScroll() {
  console.log('🚀 Initializing standalone auto-scroll...');
  
  if (typeof gsap === 'undefined') {
    console.error('❌ GSAP not loaded - cannot start auto-scroll');
    return;
  }
  
  const isHomepage = window.location.pathname === '/' || 
                     window.location.pathname === '' ||
                     document.querySelector('.hero_wrap') ||
                     document.querySelector('.studio_svg');
  
  if (!isHomepage) {
    console.log('ℹ️ Not homepage - skipping auto-scroll');
    return;
  }
  
  setTimeout(() => {
    const scrollHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const maxScroll = scrollHeight - windowHeight;
    
    console.log('📏 Standalone scroll check:', {
      scrollHeight,
      windowHeight,
      maxScroll,
      currentScroll: window.scrollY
    });
    
    if (maxScroll <= 0) {
      console.log('❌ Page doesn\'t scroll');
      return;
    }
    
    console.log('🔄 Starting standalone auto-scroll');
    const startPos = window.scrollY;
    const scrollDuration = 20; // Duration in seconds (faster)
    
    // Use GSAP ScrollToPlugin for smooth scrolling
    if (gsap.plugins && gsap.plugins.scrollTo) {
      console.log('✨ Using ScrollToPlugin for smooth auto-scroll');
      standaloneIsAutoScrolling = true;
      standaloneScrollTween = gsap.to(window, {
        scrollTo: { y: maxScroll, autoKill: false },
        duration: scrollDuration,
        ease: "none",
        onStart: () => {
          standaloneIsAutoScrolling = true;
          console.log('✨ Standalone auto-scroll started!');
          console.log(`   Scrolling from ${startPos}px to ${maxScroll}px over ${scrollDuration} seconds`);
        },
        onComplete: () => {
          standaloneIsAutoScrolling = false;
          console.log('✅ Standalone auto-scroll complete - reached bottom');
        }
      });
    } else {
      // Fallback to manual scroll (less smooth)
      console.log('⚠️ ScrollToPlugin not available, using fallback');
      const scrollProxy = { scroll: window.scrollY };
      standaloneScrollTween = gsap.to(scrollProxy, {
        scroll: maxScroll,
        duration: scrollDuration,
        ease: "none",
        onUpdate: function() {
          if (!standaloneIsUserScrolling) {
            window.scrollTo(0, scrollProxy.scroll);
          }
        },
        onComplete: () => {
          console.log('✅ Standalone auto-scroll complete - reached bottom');
        }
      });
    }
    
    // Handle user scrolling for standalone version - ONLY detect actual user input
    function handleStandaloneUserInput() {
      // Only pause if auto-scroll is actually running
      if (!standaloneIsAutoScrolling) return;
      
      standaloneIsUserScrolling = true;
      if (standaloneScrollTween) {
        standaloneScrollTween.pause();
        standaloneIsAutoScrolling = false;
        console.log('⏸️ Auto-scroll paused (user scrolling)');
      }
      
      if (standaloneUserScrollTimeout) {
        clearTimeout(standaloneUserScrollTimeout);
      }
      
      standaloneUserScrollTimeout = setTimeout(() => {
        standaloneIsUserScrolling = false;
        console.log('▶️ User stopped scrolling, resuming auto-scroll...');
        
        if (standaloneScrollTween) {
          const currentScroll = window.scrollY;
          const remainingDistance = maxScroll - currentScroll;
          
          // If we've reached the end, don't resume
          if (remainingDistance <= 10) {
            console.log('✅ Already at bottom, auto-scroll complete');
            return;
          }
          
          // Always create a new tween with consistent speed
          const totalDistance = maxScroll - startPos;
          const scrollSpeed = totalDistance / 20; // pixels per second (matches initial duration)
          const remainingDuration = remainingDistance / scrollSpeed;
          
          console.log(`📊 Resume: ${remainingDistance.toFixed(0)}px remaining, ${remainingDuration.toFixed(1)}s at ${scrollSpeed.toFixed(1)}px/s`);
          
          // Kill old tween
          standaloneScrollTween.kill();
          
          // Create new tween with consistent speed using ScrollToPlugin
          if (gsap.plugins && gsap.plugins.scrollTo) {
            standaloneIsAutoScrolling = true;
            standaloneScrollTween = gsap.to(window, {
              scrollTo: { y: maxScroll, autoKill: false },
              duration: remainingDuration,
              ease: "none",
              onComplete: () => {
                standaloneIsAutoScrolling = false;
                console.log('✅ Standalone auto-scroll complete');
              }
            });
          } else {
            // Fallback
            const newScrollProxy = { scroll: currentScroll };
            standaloneScrollTween = gsap.to(newScrollProxy, {
              scroll: maxScroll,
              duration: remainingDuration,
              ease: "none",
              onUpdate: () => {
                if (!standaloneIsUserScrolling) {
                  window.scrollTo(0, newScrollProxy.scroll);
                }
              },
              onComplete: () => {
                console.log('✅ Standalone auto-scroll complete');
              }
            });
          }
          console.log('▶️ Resumed auto-scroll with consistent speed');
        }
      }, 1500);
    }
    
    // Only add listeners if not already added (avoid duplicates)
    // ONLY listen to actual user input, NOT scroll events
    if (!window.standaloneScrollListenersAdded) {
      document.addEventListener('wheel', handleStandaloneUserInput, { passive: true });
      document.addEventListener('touchstart', handleStandaloneUserInput, { passive: true });
      document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' '].includes(e.key)) {
          handleStandaloneUserInput();
        }
      }, { passive: true });
      window.standaloneScrollListenersAdded = true;
    }
  }, 2000);
}

// ================================================================================
// 🎭 LANDING SCROLL TEXT OPACITY ANIMATION
// Targets .u-text inside [data-landing-scroll="true"]
// Opacity is 1 near viewport center, 0 when away from center
// ================================================================================

let landingScrollTweens = [];

function initLandingScrollOpacity() {
  console.log('🎭 Initializing Landing scroll text opacity animation...');
  
  if (typeof gsap === 'undefined') {
    console.error('❌ GSAP not loaded - cannot animate Landing scroll');
    return;
  }
  
  // Clean up any existing animations
  landingScrollTweens.forEach(tween => {
    if (tween && tween.kill) tween.kill();
  });
  landingScrollTweens = [];
  
  const landingSections = document.querySelectorAll('[data-landing-scroll="true"]');
  
  if (landingSections.length === 0) {
    console.log('ℹ️ No sections with data-landing-scroll="true" found');
    console.log('💡 Add Custom Attribute: data-landing-scroll = true');
    return;
  }
  
  console.log(`✅ Found ${landingSections.length} section(s) with data-landing-scroll="true"`);
  
  const textElements = [];
  landingSections.forEach((section, index) => {
    const texts = Array.from(section.querySelectorAll('.u-text'));
    if (texts.length === 0) {
      console.log(`   ⚠️ Section ${index + 1}: no .u-text found`);
      return;
    }
    console.log(`   ✅ Section ${index + 1}: ${texts.length} .u-text elements`);
    textElements.push(...texts);
  });
  
  if (textElements.length === 0) {
    console.log('ℹ️ No .u-text elements found inside data-landing-scroll sections');
    return;
  }
  
  // Set initial opacity to 0 (hidden away from center)
  gsap.set(textElements, { opacity: 0 });
  
  function updateOpacity() {
    const viewportCenter = window.innerHeight * 0.5;
    const maxDistance = window.innerHeight * 0.15; // tighter focus (faster drop-off)
    
    textElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height * 0.5;
      const distance = Math.abs(elCenter - viewportCenter);
      
      // Map distance to opacity (1 at center, 0 at edges)
      let opacity = 1 - (distance / maxDistance);
      opacity = Math.max(0, Math.min(1, opacity));
      
      // Smooth the fade
      gsap.to(el, {
        opacity,
        duration: 0.25,
        ease: "power2.out",
        overwrite: true
      });
    });
  }
  
  // Shared scroll listener
  let rafId = null;
  function handleScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      updateOpacity();
      rafId = null;
    });
  }
  
  // Initial update
  updateOpacity();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleScroll, { passive: true });
  
  landingScrollTweens.push({
    kill: () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      gsap.set(textElements, { opacity: 1 });
    }
  });
  
  console.log('✅ Landing scroll text opacity animation initialized');
  
  // Manual test
  window.testLandingScroll = () => {
    console.log('🧪 Testing Landing scroll text animation...');
    gsap.to(textElements, {
      opacity: 0.2,
      duration: 0.6,
      yoyo: true,
      repeat: 1,
      onComplete: () => gsap.set(textElements, { opacity: 1 })
    });
  };
}

// Try to start auto-scroll if DOM is already loaded (for direct page loads)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('📄 DOM already ready, initializing standalone auto-scroll...');
  initStandaloneAutoScroll();
  initLandingScrollOpacity();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded (standalone), initializing auto-scroll...');
    initStandaloneAutoScroll();
    initLandingScrollOpacity();
  });
}
