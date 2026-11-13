cmake_minimum_required(VERSION 3.13)

project(appmodules)

# Shorten generated object paths so Ninja can build React Native codegen on Windows.
set(CMAKE_OBJECT_PATH_MAX 200)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)
