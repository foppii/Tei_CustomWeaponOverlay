/*:
 * @plugindesc Weapon Overlays for VE_BattlerGraphicSetup and VE_BattleMotions
 * @author Tei
 * @help
 *
 * This add-on for VE_BattlerGraphicSetup is my first 'released' plugin hehe. :D
 *
 * Make two folders in your 'img/weapons' folder:
 *   - behind
 *   - above
 *
 * Add the weapon overlay images to those folders.
 *
 * IMPORTANT: Each sheet must be the exact size and layout as your battler! 
 * Holder's battlers and weapon sheets are perfect for this.
 *
 * Add <WeaponOverlay: 'filename'> to a weapon's notebox.
 * The plugin will try to load:
 *   img/weapons/behind/filename.png
 *   img/weapons/above/filename.png
 *
 * Feel free to just use either behind or above (or use both).
 */

(function() {

    // --- get overlay filename from weapon notetag ---
    Game_Actor.prototype.weaponOverlayName = function() {
        var weapon = this.weapons()[0];
        if (!weapon || !weapon.note) return null;
        var match = weapon.note.match(/<WeaponOverlay:\s*([A-Za-z0-9_]+)>/i);
        return match ? match[1] : null;
    };

    // --- sprite setup ---
    var _Sprite_Actor_initMembers = Sprite_Actor.prototype.initMembers;
    Sprite_Actor.prototype.initMembers = function() {
        _Sprite_Actor_initMembers.call(this);
        this._overlaySprites = { behind: null, above: null };
        this._weaponOverlayName = null;
        this._overlayLastMotion = null;
        this._overlayLastPattern = null;
    };

    // --- update bitmap ---
    var _Sprite_Actor_updateBitmap = Sprite_Actor.prototype.updateBitmap;
    Sprite_Actor.prototype.updateBitmap = function() {
        _Sprite_Actor_updateBitmap.call(this);
        this.refreshWeaponOverlay();
    };

    // --- refresh motion ---
    var _Sprite_Actor_refreshMotion = Sprite_Actor.prototype.refreshMotion;
    Sprite_Actor.prototype.refreshMotion = function() {
        _Sprite_Actor_refreshMotion.call(this);
        this.refreshWeaponOverlay();
    };

    // --- load overlay safely ---
    Sprite_Actor.prototype.loadOverlayBitmap = function(folder, name) {
        var path = folder + name + '.png';
        try {
            require('fs').accessSync(path);
            return ImageManager.loadNormalBitmap(path, 0);
        } catch (e) {
            return null;
        }
    };

    // --- refresh overlays ---
    Sprite_Actor.prototype.refreshWeaponOverlay = function() {
        if (!this._actor || !this._mainSprite) return;
        var overlayName = this._actor.weaponOverlayName();

        if (overlayName !== this._weaponOverlayName) {
            this._weaponOverlayName = overlayName;

            // clear old
            for (let key in this._overlaySprites) {
                if (this._overlaySprites[key]) {
                    if (key === 'behind') {
                        this.removeChild(this._overlaySprites[key]);
                    } else {
                        this._mainSprite.removeChild(this._overlaySprites[key]);
                    }
                    this._overlaySprites[key] = null;
                }
            }

            if (overlayName) {
                // behind
                var behind = this.loadOverlayBitmap('img/weapons/behind/', overlayName);
                if (behind) {
                    var spr = new Sprite(behind);
                    spr.anchor.x = 0.5;
                    spr.anchor.y = 1.0;
                    this._overlaySprites.behind = spr;
                    this.addChildAt(spr, 0);
                }

                // above
                var above = this.loadOverlayBitmap('img/weapons/above/', overlayName);
                if (above) {
                    var spr2 = new Sprite(above);
                    spr2.anchor.x = 0.5;
                    spr2.anchor.y = 1.0;
                    this._overlaySprites.above = spr2;
                    this._mainSprite.addChild(spr2);
                }
            }
        }
    };

    // --- frame updates ---
    var _Sprite_Actor_updateFrame = Sprite_Actor.prototype.updateFrame;
    Sprite_Actor.prototype.updateFrame = function() {
        _Sprite_Actor_updateFrame.call(this);
        this.updateWeaponOverlayFrame();
    };

    Sprite_Actor.prototype.updateWeaponOverlayFrame = function() {
        var setup = this._frameSetup || {frames: 3, poses: 18, columns: 3, adjust: 0};
        var motion = this._motion;
        var pattern = this._pattern;

        if (motion && motion.name === 'idle' && this._overlayLastMotion && this._overlayLastMotion.name === 'damage') {
            motion = this._overlayLastMotion;
            pattern = this._overlayLastPattern;
        } else if (motion && motion.name !== 'idle') {
            this._overlayLastMotion = motion;
            this._overlayLastPattern = pattern;
        }

        var index = motion ? motion.index : 0;
        var pc = setup.poses / setup.columns;
        var cw = this._mainSprite.bitmap.width / (setup.columns * setup.frames);
        var ch = this._mainSprite.bitmap.height / pc;
        var cx = Math.floor(index / pc) * setup.frames + pattern;
        var cy = index % Math.floor(pc);

        for (let key in this._overlaySprites) {
            let spr = this._overlaySprites[key];
            if (spr && spr.bitmap && spr.bitmap.isReady()) {
                spr.setFrame(cx * cw, cy * ch, cw, ch);
                spr.x = 0;
                spr.y = 0;
                spr.visible = this.visible;
            }
        }
    };

})();
