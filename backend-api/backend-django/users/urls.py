from django.urls import path
from .views import login_siswa

urlpatterns = [
    path('login/', login_siswa),
]