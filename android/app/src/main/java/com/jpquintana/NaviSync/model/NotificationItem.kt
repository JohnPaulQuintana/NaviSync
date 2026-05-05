package com.jpquintana.NaviSync.model

data class NotificationItem(
    val clientId: String,
    val userId: String,
    val deviceId: String,
    val app: String,
    val title: String,
    val text: String,
    val time: Long
)