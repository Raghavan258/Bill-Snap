const fs = require('fs');
const path = require('path');
const {
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
  withProjectBuildGradle,
} = require('@expo/config-plugins');

const GRADLE_PROPERTIES = {
  'org.gradle.jvmargs': '-Xmx2048m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8',
  'org.gradle.parallel': 'false',
  'org.gradle.workers.max': '2',
  'kotlin.compiler.execution.strategy': 'in-process',
  'reactNativeArchitectures': 'arm64-v8a',
};

const SHORT_HOME = 'set "GRADLE_USER_HOME=C:\\g"';

/** Keeps native builds under Windows' 260-character path limit and lowers memory use. */
function withAndroidBuild(config) {
  config = withGradleProperties(config, (gradle) => {
    for (const [key, value] of Object.entries(GRADLE_PROPERTIES)) {
      setProperty(gradle.modResults, key, value);
    }
    return gradle;
  });
  config = withShortObjectPaths(config);
  return withDangerousMod(config, [
    'android',
    (android) => {
      forceShortGradleHome(android.modRequest.platformProjectRoot);
      return android;
    },
  ]);
}

const CMAKE_ARGUMENT = 'arguments "-DCMAKE_OBJECT_PATH_MAX=240"';

const LIBRARY_CMAKE_LIMIT = `
subprojects { subproject ->
    subproject.plugins.withId("com.android.library") {
        subproject.androidComponents.finalizeDsl { ext ->
            if (ext.externalNativeBuild.cmake.path == null) {
                return
            }
            def args = ext.defaultConfig.externalNativeBuild.cmake.arguments
            if (args.every { !it.toString().contains("CMAKE_OBJECT_PATH_MAX") }) {
                args.add("-DCMAKE_OBJECT_PATH_MAX=240")
            }
        }
    }
}
`;

function withShortObjectPaths(config) {
  config = withAppBuildGradle(config, (gradle) => {
    if (!gradle.modResults.contents.includes('CMAKE_OBJECT_PATH_MAX')) {
      gradle.modResults.contents = gradle.modResults.contents.replace(
        'versionName "1.0.0"',
        `versionName "1.0.0"\n        externalNativeBuild {\n            cmake {\n                ${CMAKE_ARGUMENT}\n            }\n        }`,
      );
    }
    return gradle;
  });
  return withProjectBuildGradle(config, (gradle) => {
    if (!gradle.modResults.contents.includes('CMAKE_OBJECT_PATH_MAX')) {
      gradle.modResults.contents += LIBRARY_CMAKE_LIMIT;
    }
    return gradle;
  });
}

function setProperty(items, key, value) {
  const existing = items.find((item) => item.type === 'property' && item.key === key);
  if (existing) existing.value = value;
  else items.push({ type: 'property', key, value });
}

function forceShortGradleHome(androidRoot) {
  const gradlew = path.join(androidRoot, 'gradlew.bat');
  const text = fs.readFileSync(gradlew, 'utf8');
  if (text.includes(SHORT_HOME)) return;
  const needle = 'if "%OS%"=="Windows_NT" setlocal';
  if (!text.includes(needle)) return;
  const insert = [
    needle,
    SHORT_HOME,
    'if not exist "C:\\g" mkdir "C:\\g"',
    'set "CMAKE_BUILD_PARALLEL_LEVEL=1"',
  ].join('\r\n');
  fs.writeFileSync(gradlew, text.replace(needle, insert));
}

module.exports = withAndroidBuild;
