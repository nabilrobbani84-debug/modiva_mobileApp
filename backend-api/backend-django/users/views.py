from django.shortcuts import render

from django.db import connection
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse

def home(request):
    return JsonResponse({
        "message": "API MODIVA berjalan"
    })

@api_view(['POST'])
def login_siswa(request):
    nis = request.data.get('nis')
    kode_sekolah = request.data.get('kode_sekolah')

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT s.id, s.nis, s.nama, sk.kode, sk.nama
                FROM siswa s
                JOIN sekolah sk ON s.sekolah_id = sk.id
                WHERE s.nis = %s AND sk.kode = %s
            """, [nis, kode_sekolah])

            user = cursor.fetchone()

        if user:
            #  TAMBAHKAN PAYLOAD KE JWT
            refresh = RefreshToken()
            refresh['siswa_id'] = user[0]
            refresh['nis'] = user[1]
            refresh['nama'] = user[2]
            refresh['sekolah'] = user[4]

            return Response({
                'message': 'Login berhasil',
                'access': str(refresh.access_token),
                'data': {
                    'siswa_id': user[0],
                    'nis': user[1],
                    'nama': user[2],
                    'sekolah': user[4]
                }
            })

        return Response({'error': 'NIS atau kode sekolah salah'}, status=401)

    except Exception as e:
        return Response({'error': str(e)}, status=500)