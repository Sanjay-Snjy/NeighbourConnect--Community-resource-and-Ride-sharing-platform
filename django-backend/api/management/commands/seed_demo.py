"""
Seed the database with realistic NeighbourHub demo data.

Usage:
    python manage.py seed_demo            # create demo data (idempotent-ish)
    python manage.py seed_demo --reset    # wipe app data first, then seed

All demo residents share the password ``demopass123``. A superuser
``admin`` / ``adminpass123`` is also created for the Django admin.
"""

from __future__ import annotations

import datetime as dt

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.models import (
    CarpoolRide,
    Comment,
    CommunityNotice,
    Conversation,
    Event,
    EventBooking,
    Like,
    Message,
    Notification,
    Poll,
    PollOption,
    PollVote,
    Resource,
    ResourceRequest,
    RideRequest,
)

User = get_user_model()

DEMO_PASSWORD = "demopass123"

RESIDENTS = [
    ("sanjay", "Sanjay Mehta", "Maple Grove", "Morning runner, dad of two, always up for a chai."),
    ("priya", "Priya Nair", "Maple Grove", "Community volunteer and enthusiastic baker."),
    ("arjun", "Arjun Rao", "Maple Grove", "Cyclist and weekend gardener growing too many tomatoes."),
    ("meera", "Meera Kapoor", "Willow Creek", "Book lover setting up the neighborhood little library."),
    ("david", "David Fernandes", "Willow Creek", "Carpenter — happy to lend tools any time."),
    ("aisha", "Aisha Khan", "Maple Grove", "Just moved in. Say hi if you see me around!"),
    ("rahul", "Rahul Verma", "Maple Grove", "Software engineer who lives for weekend badminton."),
    ("lena", "Lena Fischer", "Maple Grove", "Yoga instructor and serial event organizer."),
]


class Command(BaseCommand):
    help = "Seed the database with realistic NeighbourHub demo data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing app data (keeps superusers) before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self._reset()

        users = self._create_users()
        self._create_admin()
        self._create_feed(users)
        self._create_resources(users)
        self._create_carpool(users)
        self._create_events(users)
        self._create_notices(users)
        self._create_messages(users)
        self._create_notifications(users)

        self.stdout.write(self.style.SUCCESS("\n✔ Demo data ready."))
        self.stdout.write("  Residents log in with password: " + self.style.WARNING(DEMO_PASSWORD))
        self.stdout.write("  Try: " + self.style.WARNING("sanjay@example.com / demopass123"))
        self.stdout.write("  Admin: " + self.style.WARNING("admin / adminpass123") + " → /admin/")

    # ── reset ────────────────────────────────────────────────────────────────
    def _reset(self):
        self.stdout.write("Resetting app data…")
        for model in (
            Notification, Message, Conversation, EventBooking, Event,
            RideRequest, CarpoolRide, ResourceRequest, Resource,
            PollVote, PollOption, Poll, Like, Comment, Post, CommunityNotice,
        ):
            model.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    # ── users ──────────────────────────────────────────────────────────────
    def _create_users(self):
        users = {}
        for username, full_name, neighborhood, bio in RESIDENTS:
            first, _, last = full_name.partition(" ")
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@example.com",
                    "first_name": first,
                    "last_name": last,
                },
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save()
            # Profile is auto-created by signal.
            profile = user.profile
            profile.neighborhood = neighborhood
            profile.bio = bio
            profile.save()
            users[username] = user
        self.stdout.write(f"  → {len(users)} residents")
        return users

    def _create_admin(self):
        if not User.objects.filter(username="admin").exists():
            admin = User.objects.create_superuser(
                "admin", "admin@example.com", "adminpass123"
            )
            admin.profile.neighborhood = "Maple Grove"
            admin.profile.bio = "Community administrator."
            admin.profile.save()

    # ── feed ─────────────────────────────────────────────────────────────────
    def _create_feed(self, u):
        if Post.objects.exists():
            return

        p1 = Post.objects.create(
            author=u["sanjay"],
            content=(
                "Huge thanks to the 20+ neighbors who showed up for the Riverside "
                "Park cleanup this morning! We filled twelve bags and the play area "
                "looks brand new. Coffee's on me next time. ☕"
            ),
        )
        Like.objects.bulk_create(
            [Like(post=p1, user=u[name]) for name in ("priya", "arjun", "lena", "david")]
        )
        Comment.objects.create(post=p1, author=u["priya"], content="You legend! It looks incredible.")
        Comment.objects.create(post=p1, author=u["lena"], content="Count me in for the next one.")

        p2 = Post.objects.create(
            author=u["priya"],
            content="Planning the summer street festival — help us pick a theme! 🎉",
        )
        poll = Poll.objects.create(post=p2, question="What should this year's festival theme be?")
        options = PollOption.objects.bulk_create(
            [
                PollOption(poll=poll, text="Food & Music", position=0),
                PollOption(poll=poll, text="Sports Day", position=1),
                PollOption(poll=poll, text="Cultural Night", position=2),
                PollOption(poll=poll, text="Kids Carnival", position=3),
            ]
        )
        votes = [
            PollVote(poll=poll, option=options[0], user=u["sanjay"]),
            PollVote(poll=poll, option=options[0], user=u["arjun"]),
            PollVote(poll=poll, option=options[2], user=u["meera"]),
            PollVote(poll=poll, option=options[1], user=u["rahul"]),
            PollVote(poll=poll, option=options[0], user=u["lena"]),
        ]
        PollVote.objects.bulk_create(votes)

        Post.objects.create(
            author=u["david"],
            content=(
                "Built a little free pantry next to the community hall. Take what you "
                "need, leave what you can. Non-perishables only please 🙏"
            ),
        )
        Post.objects.create(
            author=u["lena"],
            content="Starting sunrise yoga in the park every Saturday at 6:30am. All levels welcome!",
        )
        p5 = Post.objects.create(
            author=u["aisha"],
            content="Hi everyone! Just moved into Maple Grove with my partner. Any tips for good local produce? 🥕",
        )
        Like.objects.bulk_create([Like(post=p5, user=u[name]) for name in ("sanjay", "priya", "arjun")])
        Comment.objects.create(post=p5, author=u["arjun"], content="Welcome! I sell homegrown veg every Sunday — come by.")

        self.stdout.write("  → community feed (posts, poll, comments, likes)")

    # ── resources ──────────────────────────────────────────────────────────
    def _create_resources(self, u):
        if Resource.objects.exists():
            return
        data = [
            (u["rahul"], "The Pragmatic Programmer", "books", "Classic software book, happy to lend for a couple of weeks.", "Maple Grove, Block A"),
            (u["meera"], "Kids' picture books (box of 15)", "books", "My children outgrew these — perfect for ages 3-6.", "Willow Creek"),
            (u["david"], "Cordless drill + bit set", "tools", "Bosch 18V, fully charged. Great for weekend projects.", "Willow Creek, Block C"),
            (u["david"], "Extension ladder (6ft)", "tools", "Sturdy aluminium ladder. Please return same day.", "Willow Creek, Block C"),
            (u["rahul"], "Badminton racket set (4)", "sports", "Two pairs of rackets + shuttles. Let's play!", "Maple Grove Sports Court"),
            (u["lena"], "Yoga mats (x3)", "sports", "Spare mats for anyone joining the park sessions.", "Maple Grove"),
            (u["arjun"], "Homegrown tomatoes & basil", "food", "Fresh from the garden, picked this morning.", "Maple Grove, Community Garden"),
            (u["lena"], "Folding tables (x4)", "other", "Great for events and parties. Collect and drop back.", "Maple Grove Hall"),
            (u["priya"], "Baby stroller (gently used)", "other", "Clean and in great condition. Free to a good home.", "Maple Grove, Block B"),
        ]
        resources = [
            Resource(owner=owner, name=name, category=cat, description=desc, location=loc)
            for owner, name, cat, desc, loc in data
        ]
        Resource.objects.bulk_create(resources)
        # A couple of pending requests.
        drill = Resource.objects.filter(name__icontains="drill").first()
        if drill:
            ResourceRequest.objects.create(
                resource=drill, requester=u["sanjay"], message="Could I borrow this Saturday?"
            )
        self.stdout.write("  → resources + requests")

    # ── carpool ───────────────────────────────────────────────────────────
    def _create_carpool(self, u):
        if CarpoolRide.objects.exists():
            return
        today = timezone.localdate()

        def d(days):
            return today + dt.timedelta(days=days)

        offer1 = CarpoolRide.objects.create(
            user=u["sanjay"], ride_type="offer", origin="Maple Grove",
            destination="Downtown Tech Park", date=d(1), time=dt.time(8, 30),
            seats=3, notes="Leaving from the main gate. Can drop along MG Road.",
        )
        CarpoolRide.objects.create(
            user=u["meera"], ride_type="offer", origin="Willow Creek",
            destination="Central City Library", date=d(3), time=dt.time(10, 0),
            seats=2, notes="Weekly library run — back by 1pm.",
        )
        CarpoolRide.objects.create(
            user=u["aisha"], ride_type="request", origin="Maple Grove",
            destination="International Airport", date=d(5), time=dt.time(6, 0),
            seats=1, notes="Early flight — happy to share fuel costs.",
        )
        CarpoolRide.objects.create(
            user=u["rahul"], ride_type="offer", origin="Maple Grove",
            destination="Riverside Sports Complex", date=d(2), time=dt.time(7, 0),
            seats=2, notes="Sunday badminton crew, join us!",
        )
        RideRequest.objects.create(
            ride=offer1, requester=u["rahul"], seats=1, message="Perfect timing, thanks!"
        )
        self.stdout.write("  → carpool rides + requests")

    # ── events ───────────────────────────────────────────────────────────────
    def _create_events(self, u):
        if Event.objects.exists():
            return
        today = timezone.localdate()

        def d(days):
            return today + dt.timedelta(days=days)

        events = [
            (u["sanjay"], "Riverside Park Cleanup", "cleanup", d(6), dt.time(8, 0), dt.time(11, 0),
             "Riverside Park, main entrance", "Bring gloves — bags and refreshments provided.", 40),
            (u["lena"], "Maple Grove Sports Day", "sports", d(12), dt.time(9, 0), dt.time(16, 0),
             "Community Sports Court", "Football, badminton, races and more. Fun for all ages!", 100),
            (u["priya"], "Monthly Neighborhood Meeting", "meeting", d(9), dt.time(18, 30), dt.time(20, 0),
             "Community Hall", "Agenda: festival planning, parking, and the new garden beds.", None),
            (u["priya"], "Summer Street Festival", "festival", d(20), dt.time(16, 0), dt.time(22, 0),
             "Maple Grove High Street", "Food stalls, live music, and games. Volunteers welcome!", 300),
            (u["arjun"], "Home Composting Workshop", "workshop", d(14), dt.time(11, 0), dt.time(12, 30),
             "Community Garden", "Learn to turn kitchen scraps into rich compost.", 25),
            (u["rahul"], "Weekend Coding Study Group", "study", d(8), dt.time(15, 0), dt.time(17, 0),
             "Library Meeting Room 2", "Casual peer study — bring your laptop and questions.", 12),
        ]
        for organizer, title, cat, date, start, end, loc, desc, cap in events:
            ev = Event.objects.create(
                organizer=organizer, title=title, category=cat, date=date,
                start_time=start, end_time=end, location=loc, description=desc,
                max_attendees=cap,
            )
            # A few attendees each.
            for name in ("sanjay", "priya", "arjun", "lena")[: (ev.id % 4) + 1]:
                EventBooking.objects.get_or_create(event=ev, user=u[name])
        self.stdout.write("  → events + attendees")

    # ── notices ───────────────────────────────────────────────────────────
    def _create_notices(self, u):
        if CommunityNotice.objects.exists():
            return
        CommunityNotice.objects.create(
            author=u["priya"], title="Scheduled water supply interruption",
            description="Water will be shut off this Saturday 9:00am–1:00pm for main line repairs. Please store enough for the morning.",
            priority="high", category="water",
        )
        CommunityNotice.objects.create(
            author=u["sanjay"], title="Collect deliveries promptly",
            description="A few residents reported missing parcels near Block B. Please collect deliveries quickly and report anything suspicious.",
            priority="normal", category="security",
        )
        CommunityNotice.objects.create(
            author=u["david"], title="Block C elevator maintenance",
            description="The Block C elevator will be serviced Thursday 10am–2pm. Please use the stairs during this window.",
            priority="normal", category="maintenance",
        )
        CommunityNotice.objects.create(
            author=u["lena"], title="Storm warning — secure loose items",
            description="A strong storm is forecast tonight. Please bring in plants, furniture, and anything that could blow away. Stay safe!",
            priority="urgent", category="emergency", is_pinned=True,
        )
        self.stdout.write("  → community notices")

    # ── messages ───────────────────────────────────────────────────────────
    def _create_messages(self, u):
        if Conversation.objects.exists():
            return
        c1 = Conversation.objects.create()
        c1.participants.add(u["sanjay"], u["priya"])
        Message.objects.create(conversation=c1, sender=u["priya"], content="Hey! Are you free to help set up chairs for the meeting?")
        Message.objects.create(conversation=c1, sender=u["sanjay"], content="Absolutely, I'll be there by 6. Need anything else?")
        Message.objects.create(conversation=c1, sender=u["priya"], content="Just some helping hands. Thank you! 🙌", is_read=False)

        c2 = Conversation.objects.create()
        c2.participants.add(u["aisha"], u["lena"])
        Message.objects.create(conversation=c2, sender=u["aisha"], content="Hi Lena! Is the sunrise yoga beginner-friendly?")
        Message.objects.create(conversation=c2, sender=u["lena"], content="Totally — we go at your pace. See you Saturday!", is_read=False)
        self.stdout.write("  → conversations + messages")

    # ── notifications ────────────────────────────────────────────────────────
    def _create_notifications(self, u):
        if Notification.objects.exists():
            return
        Notification.objects.create(
            recipient=u["sanjay"], actor=u["priya"], notification_type="comment",
            title="Priya Nair commented on your post", body="You legend! It looks incredible.",
            link="/app/feed",
        )
        Notification.objects.create(
            recipient=u["sanjay"], actor=u["rahul"], notification_type="carpool",
            title="Rahul Verma wants to join your ride", body="Maple Grove → Downtown Tech Park",
            link="/app/carpool",
        )
        Notification.objects.create(
            recipient=u["sanjay"], notification_type="notice",
            title="Notice: Scheduled water supply interruption",
            body="Water will be shut off this Saturday 9:00am–1:00pm.", link="/app/notices",
        )
        self.stdout.write("  → sample notifications")
