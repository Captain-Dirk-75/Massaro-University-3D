const GUIDE_NAME = 'Sage Grove';

function pickVariant(variants, seed) {
  const index = Math.abs(seed) % variants.length;
  return variants[index];
}

function hashSeed(message, history, salt = 0) {
  const base = `${message.toLowerCase()}|${history.length}|${salt}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) | 0;
  }
  return hash;
}

function detectIntent(message) {
  const text = message.toLowerCase().trim();

  if (!text || text === '__greeting__') return 'greeting';
  if (/\b(hello|hi|hey|greetings|good morning|good evening)\b/.test(text)) {
    return 'greeting';
  }
  if (/\b(who are you|your name|sage grove|sage|guide)\b/.test(text)) {
    return 'about';
  }
  if (/\b(course|courses|learn|study|lesson|module)\b/.test(text)) {
    return 'courses';
  }
  if (/\b(member|membership|subscribe|tier|patron|guest)\b/.test(text)) {
    return 'membership';
  }
  if (/\b(own|owned|bought|purchase|purchased)\b/.test(text)) {
    return 'owned';
  }
  if (/\b(library|books|reading|entrance)\b/.test(text)) {
    return 'library';
  }
  if (/\b(water|pool|fountain|reflect)\b/.test(text)) {
    return 'water';
  }
  if (/\b(campus|quad|ground|walk|path)\b/.test(text)) {
    return 'campus';
  }
  if (/\b(help|what can|how do|where)\b/.test(text)) {
    return 'help';
  }
  if (/\b(calm|peace|still|quiet|breathe|meditat)\b/.test(text)) {
    return 'stillness';
  }
  if (/\b(thank|grateful)\b/.test(text)) return 'thanks';

  return 'general';
}

function firstOwnedCourse(context) {
  return context.ownedItems.find((item) => item.type === 'course')?.title ?? null;
}

function membershipLine(context, salt) {
  if (context.isPatron) {
    return pickVariant(
      [
        `As a Patron, the full campus opens to you — courses, gatherings, and the deeper experiences.`,
        `Your Patron membership carries a quiet generosity. Much is available to you here.`,
      ],
      hashSeed('patron', [], salt),
    );
  }
  if (context.isMember) {
    return pickVariant(
      [
        `Your Member path already includes the self-paced courses and live sessions — a good foundation to tend.`,
        `Membership gives you steady access to the courses and circles. Walk with what calls to you.`,
      ],
      hashSeed('member', [], salt),
    );
  }
  return pickVariant(
    [
      `As a guest, you are welcome to wander and taste what is free. The Course Sanctuary kiosk can show you what lies beyond.`,
      `There is no hurry to belong. Browse the Sanctuary when you are curious — something may quietly invite you.`,
    ],
    hashSeed('guest', [], salt),
  );
}

const RESPONSE_BUILDERS = {
  greeting(ctx, seed) {
    const ownedCourse = firstOwnedCourse(ctx);
    const variants = [
      `Welcome back, ${ctx.name}. The morning light is gentle on the quad today.`,
      `${ctx.name} — good to see you here. Take your time; the campus is unhurried.`,
      `Hello, ${ctx.name}. I am ${GUIDE_NAME}. However long you have walked — ${ctx.campusTimeLabel} — you are right on time.`,
      `Peace to you, ${ctx.name}. The grounds remember your footsteps.`,
    ];

    let reply = pickVariant(variants, seed);

    if (ownedCourse) {
      reply += ` I notice you carry "${ownedCourse}" with you — a fine companion for the path.`;
    } else if (ctx.isGuest) {
      reply += ` When you wish, the Course Sanctuary can show what might deepen your stay.`;
    }

    return reply;
  },

  about(_ctx, seed) {
    return pickVariant(
      [
        `I am ${GUIDE_NAME} — a quiet guide for this campus. Not a teacher who lectures, but a presence who helps you find your footing.`,
        `They call me ${GUIDE_NAME}. I keep watch over the quad in my small way, and answer what I can — calmly, without hurry.`,
        `${GUIDE_NAME}, at your service. Think of me as a friend at the gate — grounded, a little spiritual, never preachy.`,
      ],
      seed,
    );
  },

  courses(ctx, seed) {
    const owned = ctx.ownedItemTitles;
    const variants = owned.length
      ? [
          `You already hold ${owned.join(', ')}. Perhaps return to one of them before reaching for something new.`,
          `Among your courses — ${owned.join(', ')} — is there one asking for a few unhurried minutes today?`,
          `${ctx.name}, your library of learning has begun. "${owned[0]}" might be worth a gentle revisit.`,
        ]
      : [
          `Self-paced courses live in the Course Sanctuary. Open the catalog with E at the kiosk, or the Sanctuary button above.`,
          `Courses here are meant to fit around your life — stillness, walking, foundations. The Sanctuary lists what is available.`,
          `If a course calls to you, the Sanctuary will show prices and what your membership already includes.`,
        ];

    return pickVariant(variants, seed) + ` ${membershipLine(ctx, seed + 1)}`;
  },

  membership(ctx, seed) {
    const variants = [
      `${ctx.name}, you walk as a ${ctx.tierName}${ctx.subscriptionPeriod ? ` (${ctx.subscriptionPeriod})` : ''}. ${membershipLine(ctx, seed)}`,
      `Your current tier is ${ctx.tierName}. ${membershipLine(ctx, seed + 2)}`,
      `Membership is a way of belonging, not a rush to consume. You are ${ctx.tierName} today. ${membershipLine(ctx, seed + 3)}`,
    ];
    return pickVariant(variants, seed);
  },

  owned(ctx, seed) {
    if (ctx.ownedItems.length === 0) {
      return pickVariant(
        [
          `You have not purchased anything individually yet — and that is perfectly fine. Your ${ctx.tierName} access may already include more than you realise.`,
          `Nothing individually owned so far. Explore the Sanctuary; some offerings are included with your tier.`,
        ],
        seed,
      );
    }

    const titles = ctx.ownedItemTitles.join(', ');
    return pickVariant(
      [
        `You own: ${titles}. Let each one breathe — there is no prize for finishing quickly.`,
        `Your purchases — ${titles} — are yours to return to whenever the moment is right.`,
        `${ctx.name}, you carry ${titles}. Honor them with small, steady visits rather than a single long push.`,
      ],
      seed,
    );
  },

  library(_ctx, seed) {
    return pickVariant(
      [
        `The library stands north of the quad — columns, warm windows, an entrance meant to feel like an invitation. Walk toward the reflecting pool and you will find it.`,
        `Follow the stone paths toward the water feature. The library facade is elegant on purpose — knowledge should feel welcoming, not cold.`,
        `Northward from here, the library rises with soft stone and morning light in its windows. A good place to pause before you enter, when that day comes.`,
      ],
      seed,
    );
  },

  water(_ctx, seed) {
    return pickVariant(
      [
        `The pool near the library is still on purpose. Let your eyes rest there a moment — reflection needs quiet.`,
        `Water here does not rush. Stand at the rim, breathe, and notice what the campus shows back to you.`,
        `The reflecting pool is a small ceremony of calm. Many visitors linger there before moving on.`,
      ],
      seed,
    );
  },

  campus(ctx, seed) {
    return pickVariant(
      [
        `You have spent ${ctx.campusTimeLabel} on campus, ${ctx.name}. The quad is the heart — paths, greenery, the kiosk, and I standing watch.`,
        `Walk the stone crossings slowly. The grounds mix grass and path deliberately — nature and order in balance.`,
        `This quad is a threshold space: not quite wilderness, not quite city. A good place to gather yourself.`,
      ],
      seed,
    );
  },

  help(ctx, seed) {
    return pickVariant(
      [
        `WASD to walk, mouse to look, E to interact. C customizes your avatar; the Sanctuary button opens the catalog. Ask me about courses, membership, the library, or simply sit with a question.`,
        `Move with WASD. Press E near the kiosk or near me. I can speak to your ${ctx.tierName} access, what you own, or the layout of the grounds.`,
        `You are doing well. Explore freely — customize with C, shop at the Sanctuary, and speak with me whenever you want a calm word.`,
      ],
      seed,
    );
  },

  stillness(_ctx, seed) {
    return pickVariant(
      [
        `Stillness is not the absence of movement — it is the absence of hurry. Stand where you are and let one breath complete itself.`,
        `Try this: notice three sounds, then three sensations in your feet. Nothing to fix. Just attend.`,
        `The campus was shaped for moments like this. You need not earn rest.`,
      ],
      seed,
    );
  },

  thanks(_ctx, seed) {
    return pickVariant(
      [
        `You are welcome. I am here when you need a steady voice.`,
        `With warmth. The campus holds you kindly.`,
        `Peace to you. Return whenever the path feels unclear.`,
      ],
      seed,
    );
  },

  general(ctx, seed) {
    return pickVariant(
      [
        `I hear you, ${ctx.name}. I may not have a precise answer — but your ${ctx.tierName} path and ${ctx.campusTimeLabel} here are not nothing. What would feel most helpful: courses, membership, or the grounds themselves?`,
        `A thoughtful question. Let it settle. Meanwhile, remember you can open the Sanctuary for offerings, or ask me about the library, the pool, or what you already own.`,
        `Not every question needs a quick answer. Stay with what you asked. If it helps, I can speak to your membership, your courses, or the quiet corners of this quad.`,
        `${ctx.name}, I walk beside you in words only. Tell me if your curiosity leans toward learning, belonging, or simply being here.`,
      ],
      seed,
    );
  },
};

/**
 * Offline-only response engine — varied, personal, Sage Grove's voice.
 */
export function getOfflineReply({ message, history, context }) {
  const intent = detectIntent(message);
  const salt = history.filter((turn) => turn.role === 'user').length;
  const seed = hashSeed(message, history, salt);
  const builder = RESPONSE_BUILDERS[intent] ?? RESPONSE_BUILDERS.general;
  return builder(context, seed);
}