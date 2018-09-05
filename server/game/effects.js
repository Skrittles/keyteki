const CannotRestriction = require('./cannotrestriction.js');
const EffectBuilder = require('./Effects/EffectBuilder');

/* Types of effect
    1. Static effects - do something for a period
    2. Dynamic effects - like static, but what they do depends on the game state
    3. Detached effects - do something when applied, and on expiration, but can be ignored in the interim
*/

const Effects = {
    // Card effects
    addHouse: (house) => EffectBuilder.card.static('addHouse', house),
    addKeyword: (keyword) => EffectBuilder.card.static('addKeyword', keyword),
    addTrait: (trait) => EffectBuilder.card.static('addTrait', trait),
    blank: () => EffectBuilder.card.static('blank'),
    bonusDamage: (match) => EffectBuilder.card.static('bonusDamage', match),
    cardCannot: (type, condition) => EffectBuilder.card.static('abilityRestrictions', new CannotRestriction(type, condition)),
    customDetachedCard: (properties) => EffectBuilder.card.detached('customEffect', properties),
    doesNotReady: () => EffectBuilder.card.static('doesNotReady'),
    gainAbility: (abilityType, properties) => EffectBuilder.card.detached('gainAbility', {
        apply: (card, context) => {
            let ability;
            properties.printedAbility = false;
            if(abilityType === 'action') {
                ability = card.action(properties);
            } else {
                if(['fight', 'reap', 'play'].includes(abilityType)) {
                    ability = card[abilityType](properties);
                } else {
                    ability = card.triggeredAbility(abilityType, properties);
                }
                ability.registerEvents();
            }
            if(context.source.grantedAbilityLimits) {
                if(context.source.grantedAbilityLimits[card.uuid]) {
                    ability.limit = context.source.grantedAbilityLimits[card.uuid];
                } else {
                    context.source.grantedAbilityLimits[card.uuid] = ability.limit;
                }
            }
            return ability;
        },
        unapply: (card, context, ability) => {
            if(abilityType === 'action') {
                card.abilities.actions = card.abilities.actions.filter(a => a !== ability);
            } else {
                card.abilities.reactions = card.abilities.reactions.filter(a => a !== ability);
                ability.unregisterEvents();
            }
        }
    }),
    ignores: (trait) => EffectBuilder.card.static('ignores', trait),
    modifyArmor: (amount) => EffectBuilder.card.flexible('modifyArmor', amount),
    modifyPower: (amount) => EffectBuilder.card.flexible('modifyPower', amount),
    takeControl: (player) => EffectBuilder.card.static('takeControl', player),
    terminalCondition: (properties) => EffectBuilder.card.detached('terminalCondition', {
        apply: (card, context) => {
            properties.target = card;
            properties.context = properties.context || context;
            return context.source.terminalCondition(() => properties);
        },
        unapply: (card, context, effect) => context.game.effectEngine.removeTerminalCondition(effect)
    }),
    transferDamage: (card) => EffectBuilder.card.static('transferDamage', card),
    // Player effects
    additionalCost: (costFactory) => EffectBuilder.player.static('additionalCost', costFactory),
    canPlay: (match) => EffectBuilder.player.static('canPlay', match),
    canPlayFromOwn: (location) => EffectBuilder.player.detached('canPlayFromOwn', {
        apply: (player) => player.addPlayableLocation('play', player, location),
        unapply: (player, context, location) => player.removePlayableLocation(location)
    }),
    canPlayHouse: (house) => EffectBuilder.player.static('canPlayHouse', house),
    canPlayNonHouse: (house) => EffectBuilder.player.static('canPlayNonHouse', house),
    canUse: (match) => EffectBuilder.player.static('canUse', match),
    canUseHouse: (house) => EffectBuilder.player.static('canUseHouse', house),
    customDetachedPlayer: (properties) => EffectBuilder.player.detached('customEffect', properties),
    delayedEffect: (properties) => EffectBuilder.player.detached('delayedEffect', {
        apply: (player, context) => {
            properties.context = properties.context || context;
            return context.source.delayedEffect(() => properties);
        },
        unapply: (card, context, effect) => context.game.effectEngine.removeDelayedEffect(effect)
    }),
    forgeAmberRecipient: (player) => EffectBuilder.player.static('forgeAmberRecipient', player),
    modifyKeyCost: (amount) => EffectBuilder.player.flexible('modifyKeyCost', amount),
    modifyHandSize: (amount) => EffectBuilder.player.flexible('modifyHandSize', amount),
    playerCannot: (type, condition) => EffectBuilder.player.static('abilityRestrictions', new CannotRestriction(type, condition)),
    redirectAmber: (recepient) => EffectBuilder.player.static('redirectAmber', recepient),
    restrictHouseChoice: (house) => EffectBuilder.player.static('restrictHouseChoice', house),
    stopHouseChoice: (house) => EffectBuilder.player.static('stopHouseChoice', house),
    showTopConflictCard: () => EffectBuilder.player.static('showTopConflictCard'),
    skipStep: (step) => EffectBuilder.player.static('skipStep', step)
};

module.exports = Effects;
