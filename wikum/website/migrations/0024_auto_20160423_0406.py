# -*- coding: utf-8 -*-
# Generated by Django 1.9.1 on 2016-04-23 04:06
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0023_comment_extra_summary'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='controversial_score',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='commentauthor',
            name='comment_karma',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='commentauthor',
            name='is_gold',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='commentauthor',
            name='is_mod',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='commentauthor',
            name='is_reddit',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='commentauthor',
            name='link_karma',
            field=models.IntegerField(default=0),
        ),
    ]
