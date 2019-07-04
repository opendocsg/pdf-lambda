#!/bin/bash
# Required: set environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
# This script does:
# 1. zip, upload, and publish a new lambda version, say version=X
# 2. if dev/prod branch, alias dev/prod to version=X (not $LATEST which always points to latest)
set -ev
aws lambda invoke --function-name create_pdf_2 --payload '{ "serializedHTML":"<!DOCTYPE html><p>Hello world</p>","serializedHTMLName":"test","serializedHTMLHash":"ZmJlZTVkYzRiNDNmYmUyYzNhNWM5OGFlODc4ZDJjNmM=","bucketName":"opendoc-theme-pdf"}' outfile.txt
