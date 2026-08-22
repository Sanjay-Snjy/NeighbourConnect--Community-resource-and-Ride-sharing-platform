"""Community feed tests: posts, likes, comments, polls, ownership."""

import pytest

from api.models import Post

pytestmark = pytest.mark.django_db

POSTS = "/api/posts/"


def test_create_post(auth_client):
    res = auth_client.post(POSTS, {"content": "Hello Maple Grove!"})
    assert res.status_code == 201
    assert res.data["content"] == "Hello Maple Grove!"
    assert res.data["is_mine"] is True


def test_empty_post_is_rejected(auth_client):
    res = auth_client.post(POSTS, {"content": ""})
    assert res.status_code == 400


def test_like_toggle(auth_client, user):
    post = Post.objects.create(author=user, content="Like me")
    liked = auth_client.post(f"{POSTS}{post.id}/like/")
    assert liked.status_code == 200
    assert liked.data["is_liked"] is True
    assert liked.data["like_count"] == 1
    unliked = auth_client.post(f"{POSTS}{post.id}/like/")
    assert unliked.data["is_liked"] is False
    assert unliked.data["like_count"] == 0


def test_comment_create_and_list(auth_client, user):
    post = Post.objects.create(author=user, content="Discuss")
    created = auth_client.post(f"{POSTS}{post.id}/comments/", {"content": "Nice one"})
    assert created.status_code == 201
    listed = auth_client.get(f"{POSTS}{post.id}/comments/")
    assert listed.status_code == 200
    assert listed.data["count"] == 1


def test_cannot_delete_others_post(auth_client, other_user):
    post = Post.objects.create(author=other_user, content="Not yours")
    res = auth_client.delete(f"{POSTS}{post.id}/")
    assert res.status_code == 403


def test_can_delete_own_post(auth_client, user):
    post = Post.objects.create(author=user, content="Mine")
    res = auth_client.delete(f"{POSTS}{post.id}/")
    assert res.status_code == 204
    assert not Post.objects.filter(id=post.id).exists()


def test_create_post_with_poll_and_vote(auth_client):
    payload = {
        "content": "Pick one",
        "poll": {"question": "Best day?", "options": ["Sat", "Sun"], "allows_multiple": False},
    }
    created = auth_client.post(POSTS, payload, format="json")
    assert created.status_code == 201
    poll = created.data["poll"]
    assert poll is not None
    option_id = poll["options"][0]["id"]
    voted = auth_client.post(f"{POSTS}{created.data['id']}/vote/", {"options": [option_id]}, format="json")
    assert voted.status_code == 200
    assert voted.data["total_votes"] == 1
    assert option_id in voted.data["my_votes"]
