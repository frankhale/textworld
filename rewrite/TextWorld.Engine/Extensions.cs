using System.Globalization;

namespace TextWorld.Engine
{
    public static class Extensions
    {
        public static string ToTitleCase(this string input)
        {
            if (input == null)
            {
                throw new ArgumentNullException(nameof(input), "Input string cannot be null.");
            }

            TextInfo textInfo = CultureInfo.CurrentCulture.TextInfo;
            return textInfo.ToTitleCase(input);
        }
    }

}
