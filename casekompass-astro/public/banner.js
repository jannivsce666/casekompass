(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        const launchDate = new Date('2026-01-01T00:00:00');
        const now = new Date();
        
        if (now < launchDate) {
            const banner = document.getElementById('launch-banner');
            if (banner) {
                banner.classList.add('active');
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
            }
        }
    });
})();
