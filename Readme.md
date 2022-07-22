## Digistar Time Dilation

This script creates a new Digistar class TimeData and a Javascript which monitors your movement speed and calculates the appropriate time dilation.

## Installation

The Digistar Javascript Proxy library is also required. Unzip both into $content/user/lib

## Usage

For a basic setup, simply run `TimeDilationLabels.ds' and three labels will show at the front of the dome indicating Earth time, Ship time, and the rate of time dilation.

For more custom setup, customise the script below to your needs.
```

script play .\TimeDilationConsole_setup.ds
script play .\TimeData.ds

## create your text objects here

timeDilationData is TimeData

# set the text objects to be populated
timeDilationData earthTimeText earthTime 
timeDilationData timeRateText timeRate 
timeDilationData shipTimeText shipTime 

js stop "timedilation"
js play .\timedilation.js

```
