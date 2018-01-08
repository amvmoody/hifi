"use strict";

//
//  emote.js
//  scripts/system/
//
//  Created by Brad Hefta-Gaub on 7 Jan 2018
//  Copyright 2018 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
/* globals Script, Tablet */
/* eslint indent: ["error", 4, { "outerIIFEBody": 0 }] */

(function() { // BEGIN LOCAL_SCOPE


var EMOTE_ANIMATIONS = ['Crying', 'Surprised', 'Dancing', 'Cheering', 'Waving', 'Fall', 'Pointing', 'Clapping'];
var ANIMATIONS = Array();


EMOTE_ANIMATIONS.forEach(function (name) {
    var animURL = Script.resolvePath("assets/animations/" + name + ".fbx");
    var resource = AnimationCache.prefetch(animURL);
    var animation = AnimationCache.getAnimation(animURL);
    ANIMATIONS[name] = { url: animURL, animation: animation, resource: resource};
});


var EMOTE_APP_BASE = "html/EmoteApp.html";
var EMOTE_APP_URL = Script.resolvePath(EMOTE_APP_BASE);
var EMOTE_LABLE = "EMOTE";
var EMOTE_APP_SORT_ORDER = 11;
var FPS = 30;
var MSEC_PER_SEC = 1000;
var FINISHED = 3; // see ScriptableResource::State

var onEmoteScreen = false;
var button;
var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");
var activeTimer = false; // used to cancel active timer if a user plays an amimation while another animation is playing

button = tablet.addButton({
    //icon: "icons/tablet-icons/emote.svg", // TODO - we need graphics for this
    text: EMOTE_LABLE,
    sortOrder: EMOTE_APP_SORT_ORDER
});

function onClicked() {
    if (onEmoteScreen) {
        tablet.gotoHomeScreen();
    } else {
        onEmoteScreen = true;
        tablet.gotoWebScreen(EMOTE_APP_URL);
    }
}

function onScreenChanged(type, url) {
    onEmoteScreen = type === "Web" && (url.indexOf(EMOTE_APP_BASE) == url.length - EMOTE_APP_BASE.length);
    button.editProperties({ isActive: onEmoteScreen });
}

// Handle the events we're receiving from the web UI
function onWebEventReceived(event) {

    // Converts the event to a JavasScript Object
    if (typeof event === "string") {
        event = JSON.parse(event);
    }

    if (event.type === "click") {
        var emoteName = event.data;

        if (ANIMATIONS[emoteName].resource.state == FINISHED) {
            if (activeTimer !== false) {
                Script.clearTimeout(activeTimer);
            }

            var frameCount = ANIMATIONS[emoteName].animation.frames.length;
            MyAvatar.overrideAnimation(ANIMATIONS[emoteName].url, FPS, false, 0, frameCount);

            var timeOut = MSEC_PER_SEC * frameCount / FPS;
            activeTimer = Script.setTimeout(function () {
                MyAvatar.restoreAnimation();
                activeTimer = false;
            }, timeOut);
        }
    }
}

button.clicked.connect(onClicked);
tablet.screenChanged.connect(onScreenChanged);
tablet.webEventReceived.connect(onWebEventReceived);

Script.scriptEnding.connect(function () {
    if (onEmoteScreen) {
        tablet.gotoHomeScreen();
    }
    button.clicked.disconnect(onClicked);
    tablet.screenChanged.disconnect(onScreenChanged);
    if (tablet) {
        tablet.removeButton(button);
    }
    if (activeTimer !== false) {
        Script.clearTimeout(activeTimer);
        MyAvatar.restoreAnimation();
    }
});


}()); // END LOCAL_SCOPE
