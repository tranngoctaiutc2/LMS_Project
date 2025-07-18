# Generated by Django 5.2 on 2025-05-20 04:59

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_alter_coupon_code_alter_coupon_discount_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='coupon',
            options={'ordering': ['-date']},
        ),
        migrations.AlterField(
            model_name='coupon',
            name='active',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='coupon',
            name='date',
            field=models.DateField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name='coupon',
            name='end_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='coupon',
            name='max_uses',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='course',
            name='level',
            field=models.CharField(blank=True, choices=[('Beginner', 'Beginner'), ('Intermediate', 'Intermediate'), ('Advanced', 'Advanced')], default='Beginner', max_length=100, null=True),
        ),
    ]
