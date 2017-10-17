"use strict";

//  highlightObjectInNearGrabRange.js
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

// TODO: find globals list for here.

Script.include("/~/system/libraries/controllerDispatcherUtils.js");
Script.include("/~/system/libraries/controllers.js");

(function () {

    function HighlightNearestGrabbableEntity(hand) {
        var _this = this;
        this.hand = hand;
        this.activeHighlightObject = null;
        this.parameters = makeDispatcherModuleParameters(
            610, // no idea what a good priority is
            _this.hand ? ["rightHand"] : ["leftHand"],
            [], // is this even implemented in the dispatcher?
            100); // or this

        this.isReady = function (controllerData) {

            if (controllerData.nearbyEntityProperties[_this.hand ? RIGHT_HAND : LEFT_HAND][0] || _this.activeHighlightObject !== null) {
                return makeRunningValues(true, [], []);
            }
            return makeRunningValues(false, [], []);

        };

        this.run = function (controllerData) {

            var nearbyEntity,
                isGrabbable,
                isCloneable,
                maybeEntityOtherHand;

            // the closest object to the controller is already computed in the dispatcher.
            nearbyEntity = controllerData.nearbyEntityProperties[_this.hand ? RIGHT_HAND : LEFT_HAND][0];
            maybeEntityOtherHand = controllerData.nearbyEntityProperties[_this.hand ? LEFT_HAND : RIGHT_HAND][0];

            //limited to grabbable and clonable objects for two reasons. If you are inside of a zone it registers in this list.
            // and i think this feature was meant for objects that can be picked up.
            if (nearbyEntity) {
                if (nearbyEntity.userData) {
                    var userData;
                    try {
                        userData = JSON.parse(nearbyEntity.userData);
                    } catch (e) {
                        print(e);
                    }

                    if (userData && userData.grabbableKey) {
                        isGrabbable = (userData.grabbableKey.grabbable);
                        isCloneable = (userData.grabbableKey.cloneable);
                    }
                }
            }


            if (nearbyEntity && isGrabbable || isCloneable) {
                if (_this.activeHighlightObject === null) {
                    _this.activeHighlightObject = nearbyEntity;
                    Selection.addToSelectedItemsList("contextOverlayHighlightList", 'entity', nearbyEntity.id);
                } else {
                    if (_this.activeHighlightObject.id !== nearbyEntity.id) {
                        Selection.removeFromSelectedItemsList("contextOverlayHighlightList", 'entity', _this.activeHighlightObject.id);
                        _this.activeHighlightObject = nearbyEntity;
                        Selection.addToSelectedItemsList("contextOverlayHighlightList", 'entity', nearbyEntity.id);
                    }
                }


            } else if (_this.activeHighlightObject !== null) {
                if (!maybeEntityOtherHand || maybeEntityOtherHand && maybeEntityOtherHand.id !== _this.activeHighlightObject.id) {
                    Selection.removeFromSelectedItemsList("contextOverlayHighlightList", 'entity', _this.activeHighlightObject.id);
                    _this.activeHighlightObject = null;
                }

            }

            return makeRunningValues(false, [], []); // not sure why but this needs to be false to let the stylus and hands and stuff work
        };
    }


    var leftHighlightNearestGrabbableEntity = new HighlightNearestGrabbableEntity(LEFT_HAND);
    var rightHighlightNearestGrabbableEntity = new HighlightNearestGrabbableEntity(RIGHT_HAND);

    enableDispatcherModule("leftHighlightNearestGrabbableEntity", leftHighlightNearestGrabbableEntity);
    enableDispatcherModule("rightHighlightNearestGrabbableEntity", rightHighlightNearestGrabbableEntity);

    this.cleanup = function () {
        disableDispatcherModule("leftHighlightNearestGrabbableEntity");
        disableDispatcherModule("rightHighlightNearestGrabbableEntity");
    };

    Script.scriptEnding.connect(this.cleanup);
}());
