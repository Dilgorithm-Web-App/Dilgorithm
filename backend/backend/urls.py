from django.contrib import admin
from django.urls import path, include

# This file defines the URL patterns for the entire backend project, routing requests to the appropriate app (in this case, the accounts app). It includes the admin interface and directs all API calls related to user accounts to the accounts.urls module for further handling.
#to connect the accounts app to the main project, we include the accounts.urls file in the urlpatterns list. This allows us to keep our URL configurations modular and organized, especially as we add more apps in the future.

urlpatterns = [
    path('admin/', admin.site.urls),
    # This routes all account traffic to the urls.py file we just made
    path('api/accounts/', include('accounts.urls')), 
]