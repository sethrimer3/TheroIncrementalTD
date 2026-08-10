/** Build only the surviving spire state while safely ignoring obsolete save branches. */
export function createSpireResourceState(overrides = {}) {
    const legacyTower = overrides.wellOfInspiration ?? overrides.powder ?? overrides.alephSpire ?? overrides.aleph ?? {};
    return {
        wellOfInspiration: {
            unlocked: true,
            storySeen: Boolean(legacyTower.storySeen),
        },
        achievements: {
            storySeen: Boolean(overrides.achievements?.storySeen),
        },
    };
}
