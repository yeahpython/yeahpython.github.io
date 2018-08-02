dir=${PWD##*/}
if [ $dir != "yeahpython.github.io" ]; then
    echo "Oops, you're in the wrong folder..."
fi
rm -r game
mkdir game/
cp ../ascii-renderer/*.html game
cp ../ascii-renderer/*.js game
cp ../ascii-renderer/*.css game