# junrar depends on slf4j-api, which looks up an optional logging binding at
# runtime. No binding is bundled (slf4j falls back to a no-op logger), so R8
# must not fail on the missing class.
-dontwarn org.slf4j.impl.StaticLoggerBinder
